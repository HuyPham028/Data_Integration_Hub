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
  // async triggerSchemaUpdate(approvedTable: string): Promise<void> {
  //   if (!this.owner || !this.repo || !this.config.get('GITHUB_PAT')) {
  //     this.logger.warn(
  //       '[GitHubDeploy] GITHUB_PAT / GITHUB_OWNER / GITHUB_REPO not configured — skipping auto-deploy.',
  //     );
  //     return;
  //   }

  //   this.logger.log(
  //     `[GitHubDeploy] Generating new schema.prisma after approval of "${approvedTable}" → branch: ${this.branch}`,
  //   );

  //   const newContent = await this.generator.generateFullSchema();

  //   // Get current file SHA (required by GitHub API to update a file)
  //   const { data: fileData } = await this.octokit.repos.getContent({
  //     owner: this.owner,
  //     repo: this.repo,
  //     path: SCHEMA_PATH,
  //     ref: this.branch,
  //   });

  //   if (Array.isArray(fileData) || fileData.type !== 'file') {
  //     throw new Error(`${SCHEMA_PATH} is not a file on GitHub`);
  //   }

  //   // Cast needed because Octokit's union type isn't fully narrowed after the guard above
  //   const file = fileData as { content: string; sha: string };

  //   const encoded = Buffer.from(newContent).toString('base64');

  //   // Skip commit if content is identical (avoids triggering pipeline unnecessarily)
  //   const currentDecoded = Buffer.from(file.content ?? '', 'base64').toString('utf8');
  //   if (currentDecoded.trim() === newContent.trim()) {
  //     this.logger.log('[GitHubDeploy] schema.prisma unchanged — no commit needed.');
  //     return;
  //   }

  //   await this.octokit.repos.createOrUpdateFileContents({
  //     owner: this.owner,
  //     repo: this.repo,
  //     path: SCHEMA_PATH,
  //     message: `chore(schema): auto-update prisma model for table "${approvedTable}"`,
  //     content: encoded,
  //     sha: file.sha,
  //     branch: this.branch,
  //   });

  //   this.logger.log(
  //     `[GitHubDeploy] Committed updated schema.prisma → GitHub Actions pipeline triggered.`,
  //   );
  // }

  /**
   * Commits multiple files in a single Git transaction.
   */
  async commitFiles(
    message: string,
    files: { path: string; content: string }[],
  ): Promise<void> {
    if (!this.owner || !this.repo) {
      this.logger.warn('GitHub config missing. Skipping commit.');
      return;
    }

    try {
      // 1. Get current commit SHA
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${this.branch}`,
      });
      const commitSha = ref.object.sha;

      // 2. Get base tree
      const { data: commit } = await this.octokit.git.getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: commitSha,
      });

      // 3. Create Blobs for each file
      const treeItems = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner: this.owner,
            repo: this.repo,
            content: file.content,
            encoding: 'utf-8',
          });
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        }),
      );

      // 4. Create new Tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner: this.owner,
        repo: this.repo,
        base_tree: commit.tree.sha,
        tree: treeItems,
      });

      // 5. Create new Commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message,
        tree: newTree.sha,
        parents: [commitSha],
      });

      // 6. Update Branch Ref
      await this.octokit.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${this.branch}`,
        sha: newCommit.sha,
      });

      this.logger.log(`[GitHubDeploy] Successfully pushed ${files.length} files to ${this.branch}.`);
    } catch (error) {
      this.logger.error(`[GitHubDeploy] Failed to commit files: ${error.message}`);
      throw error;
    }
  }
}
