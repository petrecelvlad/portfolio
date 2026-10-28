import { IExperience } from '@/src/core/domain/models';

export interface IExperienceRepository {
  getAllExperiences(): Promise<IExperience[]>;
  getExperienceById(id: string): Promise<IExperience | undefined>;
}
