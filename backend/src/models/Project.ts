import { IProject, IProjectCreate, IProjectUpdate, IProjectSummary, IProjectStatusMetric } from '../types/project.js';
import { projectRepository } from '../repositories/project.repository.js';

class Project {
  // Create a new project
  static async create(userId: string, projectData: IProjectCreate): Promise<IProject> {
    return projectRepository.create(userId, projectData);
  }

  // Find project by ID
  static async findById(id: string, userId: string): Promise<IProject | null> {
    return projectRepository.findById(id, userId);
  }

  // Get all projects for a user with filters
  static async findAllByUser(userId: string, filters: any = {}): Promise<IProject[]> {
    return projectRepository.findAllByUser(userId, filters);
  }

  // Update project
  static async update(id: string, userId: string, updates: IProjectUpdate): Promise<IProject | null> {
    return projectRepository.update(id, userId, updates);
  }

  // Delete project
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const success = await projectRepository.delete(id, userId);
    return success ? { id } : null;
  }

  // Get project statistics
  static async getStatistics(userId: string, projectId: string): Promise<any> {
    return projectRepository.getStatistics(userId, projectId);
  }

  static async getSummary(userId: string): Promise<IProjectSummary | null> {
    return projectRepository.getSummary(userId);
  }

  static async getStatusMetrics(userId: string): Promise<IProjectStatusMetric[]> {
    return projectRepository.getStatusMetrics(userId);
  }

  static async getUpcomingDeadlines(userId: string, limit: number = 6): Promise<any[]> {
    return projectRepository.getUpcomingDeadlines(userId, limit);
  }

  static async getSubscriptions(userId: string, projectId: string): Promise<any[]> {
    return projectRepository.getSubscriptions(userId, projectId);
  }
}

export default Project;
