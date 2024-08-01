import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const { authorId, title, description, bannerUrl, files, tags, category, subtasks, price } = createProjectDto;

    try {
      // Создание проекта
      const project = await this.prisma.project.create({
        data: {
          authorId,
          title,
          description,
          bannerUrl,
          files,
          tags,
          category,
          price,
        },
      });

      // Создание и привязка задач к проекту
      for (const subtask of subtasks) {
        await this.prisma.task.create({
          data: {
            title: subtask.title,
            description: subtask.description,
            price: subtask.price,
            projects: {
              create: {
                projectId: project.id,
              },
            },
          },
        });
      }

      return project;
    } catch (error) {
      throw new InternalServerErrorException('Ошибка при создании проекта');
    }
  }

  async getProjectById(id: number): Promise<Project | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          tasks: {
            include: {
              task: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException(`Проект с ID ${id} не найден`);
      }

      return project;
    } catch (error) {
      throw new InternalServerErrorException('Ошибка при получении проекта');
    }
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      return await this.prisma.project.findMany({
        include: {
          tasks: {
            include: {
              task: true,
            },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Ошибка при получении всех проектов');
    }
  }

  async updateProject(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const { title, description, bannerUrl, files, tags, category, subtasks, price } = updateProjectDto;

    try {
      // Проверка наличия проекта
      const projectExists = await this.prisma.project.findUnique({ where: { id } });
      if (!projectExists) {
        throw new NotFoundException(`Проект с ID ${id} не найден`);
      }

      // Обновление проекта
      const project = await this.prisma.project.update({
        where: { id },
        data: {
          title,
          description,
          bannerUrl,
          files,
          tags,
          category,
          price,
        },
      });

      if (subtasks) {
        const existingTasks = await this.prisma.task.findMany({
          where: {
            projects: {
              some: {
                projectId: id,
              },
            },
          },
        });

        const existingTaskIds = existingTasks.map(task => task.id);
        const newTaskIds = subtasks.map(task => task.id).filter(id => id !== undefined);

        const tasksToDelete = existingTaskIds.filter(taskId => !newTaskIds.includes(taskId));
        if (tasksToDelete.length > 0) {
          await this.prisma.projectTask.deleteMany({
            where: {
              projectId: id,
              taskId: { in: tasksToDelete },
            },
          });

          await this.prisma.task.deleteMany({
            where: { id: { in: tasksToDelete } },
          });
        }

        for (const subtask of subtasks) {
          if (subtask.id) {
            await this.prisma.task.update({
              where: { id: subtask.id },
              data: {
                title: subtask.title,
                description: subtask.description,
                price: subtask.price,
              },
            });
          } else {
            await this.prisma.task.create({
              data: {
                title: subtask.title,
                description: subtask.description,
                price: subtask.price,
                projects: {
                  create: {
                    projectId: id,
                  },
                },
              },
            });
          }
        }
      }

      return project;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Ошибка при обновлении проекта');
    }
  }

  async deleteProject(id: number): Promise<Project> {
    try {
      const projectExists = await this.prisma.project.findUnique({ where: { id } });
      if (!projectExists) {
        throw new NotFoundException(`Проект с ID ${id} не найден`);
      }

      return this.prisma.$transaction(async (prisma) => {
        await prisma.projectTask.deleteMany({
          where: { projectId: id },
        });

        await prisma.task.deleteMany({
          where: {
            projects: {
              some: {
                projectId: id,
              },
            },
          },
        });

        return prisma.project.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Ошибка при удалении проекта');
    }
  }
}
