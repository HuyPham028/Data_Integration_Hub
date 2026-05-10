import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SourceConfig } from './schemas/source-config.schema';
import { CreateSourceConfigDto } from './dto/create-source-config.dto';
import { UpdateSourceConfigDto } from './dto/update-source-config.dto';

@Injectable()
export class SourceConfigService {
  private readonly logger = new Logger(SourceConfigService.name);

  constructor(
    @InjectModel(SourceConfig.name)
    private readonly sourceConfigModel: Model<SourceConfig>,
  ) {}

  async getBySourceId(sourceId: string): Promise<SourceConfig | null> {
    if (!sourceId) return null;
    const config = await this.sourceConfigModel
      .findOne({ sourceId, isActive: true })
      .lean()
      .exec();
    if (!config) {
      this.logger.warn(`No active source config found for sourceId="${sourceId}"`);
    }
    return config as SourceConfig | null;
  }

  async findAll(): Promise<SourceConfig[]> {
    return this.sourceConfigModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec() as Promise<SourceConfig[]>;
  }

  async findOne(sourceId: string): Promise<SourceConfig> {
    const config = await this.sourceConfigModel
      .findOne({ sourceId })
      .lean()
      .exec();
    if (!config) {
      throw new NotFoundException(`Source config "${sourceId}" not found.`);
    }
    return config as SourceConfig;
  }

  async create(dto: CreateSourceConfigDto): Promise<SourceConfig> {
    const existing = await this.sourceConfigModel.findOne({ sourceId: dto.sourceId });
    if (existing) {
      throw new ConflictException(`Source config "${dto.sourceId}" already exists.`);
    }
    const created = new this.sourceConfigModel(dto);
    return created.save() as Promise<SourceConfig>;
  }

  async update(sourceId: string, dto: UpdateSourceConfigDto): Promise<SourceConfig> {
    const updated = await this.sourceConfigModel
      .findOneAndUpdate({ sourceId }, { $set: dto }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException(`Source config "${sourceId}" not found.`);
    }
    return updated as SourceConfig;
  }

  async remove(sourceId: string): Promise<{ deleted: boolean }> {
    const result = await this.sourceConfigModel.deleteOne({ sourceId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Source config "${sourceId}" not found.`);
    }
    return { deleted: true };
  }

  async toggleActive(sourceId: string): Promise<SourceConfig> {
    const config = await this.sourceConfigModel.findOne({ sourceId });
    if (!config) {
      throw new NotFoundException(`Source config "${sourceId}" not found.`);
    }
    config.isActive = !config.isActive;
    return config.save() as Promise<SourceConfig>;
  }
}
