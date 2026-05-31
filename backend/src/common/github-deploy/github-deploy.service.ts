import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { PrismaSchemaGeneratorService } from '../prisma-schema-generator/prisma-schema-generator.service';

const SCHEMA_PATH = 'backend/prisma/schema.prisma';

@Injectable()
export class GitHubDeployService {
  private readonly logger = new Logger(GitHubDeployService.name);
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly branch: string;

  constructor(
    private readonly config: ConfigService,
    private readonly generator: PrismaSchemaGeneratorService,
  ) {
    this.octokit = new Octokit({
      auth: this.config.get<string>('GITHUB_PAT'),
    });
    this.owner = this.config.get<string>('GITHUB_OWNER') ?? '';
    this.repo = this.config.get<string>('GITHUB_REPO') ?? '';
    this.branch = this.config.get<string>('GITHUB_BRANCH') ?? 'master';
  }

  /**
   * Regenerates schema.prisma from Schema Registry and commits it to GitHub.
   * The commit triggers CI/CD: unit tests → docker-compose-test → docker-push.
   */
  async triggerSchemaUpdate(approvedTable: string): Promise<void> {
    if (!this.owner || !this.repo || !this.config.get('GITHUB_PAT')) {
      this.logger.warn(
        '[GitHubDeploy] GITHUB_PAT / GITHUB_OWNER / GITHUB_REPO not configured — skipping auto-deploy.',
      );
      return;
    }

    this.logger.log(
      `[GitHubDeploy] Generating new schema.prisma after approval of "${approvedTable}" → branch: ${this.branch}`,
    );

    const newContent = await this.generator.generateFullSchema();

    // Get current file SHA (required by GitHub API to update a file)
    const { data: fileData } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: SCHEMA_PATH,
      ref: this.branch,
    });

    if (Array.isArray(fileData) || fileData.type !== 'file') {
      throw new Error(`${SCHEMA_PATH} is not a file on GitHub`);
    }

    // Cast needed because Octokit's union type isn't fully narrowed after the guard above
    const file = fileData as { content: string; sha: string };

    const encoded = Buffer.from(newContent).toString('base64');

    // Skip commit if content is identical (avoids triggering pipeline unnecessarily)
    const currentDecoded = Buffer.from(file.content ?? '', 'base64').toString('utf8');
    if (currentDecoded.trim() === newContent.trim()) {
      this.logger.log('[GitHubDeploy] schema.prisma unchanged — no commit needed.');
      return;
    }

    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: SCHEMA_PATH,
      message: `chore(schema): auto-update prisma model for table "${approvedTable}"`,
      content: encoded,
      sha: file.sha,
      branch: this.branch,
    });

    this.logger.log(
      `[GitHubDeploy] Committed updated schema.prisma → GitHub Actions pipeline triggered.`,
    );
  }
}
