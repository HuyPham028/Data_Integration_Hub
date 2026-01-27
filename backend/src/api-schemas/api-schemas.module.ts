import { Module } from '@nestjs/common';
import { ApiSchemasService } from './api-schemas.service';
import { ApiSchemasController } from './api-schemas.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiSchema, ApiSchemaSchema } from './schemas/api-schema.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ApiSchema.name, schema: ApiSchemaSchema}
    ])
  ],
  controllers: [ApiSchemasController],
  providers: [ApiSchemasService],
  exports: [ApiSchemasService],
})
export class ApiSchemasModule {}
