import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { Project } from '@prisma/client';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Создать проект' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description: 'Проект успешно создан.',
    schema: {
      example: {
        id: 1,
        authorId: 1,
        title: 'Example Project',
        description: 'Description of the example project',
        bannerUrl: 'http://example.com/banner.png',
        files: ['file1.png', 'file2.png'],
        tags: ['tag1', 'tag2'],
        category: 'Category Name',
        price: 1000,
        tasks: [
          {
            id: 1,
            title: 'Task 1',
            description: 'Description of task 1',
            price: 500,
          },
          {
            id: 2,
            title: 'Task 2',
            description: 'Description of task 2',
            price: 500,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
  async createProject(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectService.createProject(createProjectDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить проект по ID' })
  @ApiParam({ name: 'id', description: 'ID проекта' })
  @ApiResponse({
    status: 200,
    description: 'Проект найден.',
    schema: {
      example: {
        id: 1,
        authorId: 1,
        title: 'Example Project',
        description: 'Description of the example project',
        bannerUrl: 'http://example.com/banner.png',
        files: ['file1.png', 'file2.png'],
        tags: ['tag1', 'tag2'],
        category: 'Category Name',
        price: 1000,
        tasks: [
          {
            id: 1,
            title: 'Task 1',
            description: 'Description of task 1',
            price: 500,
          },
          {
            id: 2,
            title: 'Task 2',
            description: 'Description of task 2',
            price: 500,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Проект не найден.' })
  async getProjectById(@Param('id') id: string): Promise<Project | null> {
    const projectId = parseInt(id);
    return this.projectService.getProjectById(projectId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все проекты' })
  @ApiResponse({
    status: 200,
    description: 'Список проектов.',
    schema: {
      example: [
        {
          id: 1,
          authorId: 1,
          title: 'Example Project',
          description: 'Description of the example project',
          bannerUrl: 'http://example.com/banner.png',
          files: ['file1.png', 'file2.png'],
          tags: ['tag1', 'tag2'],
          category: 'Category Name',
          price: 1000,
          tasks: [
            {
              id: 1,
              title: 'Task 1',
              description: 'Description of task 1',
              price: 500,
            },
            {
              id: 2,
              title: 'Task 2',
              description: 'Description of task 2',
              price: 500,
            },
          ],
        },
      ],
    },
  })
  async getAllProjects(): Promise<Project[]> {
    return this.projectService.getAllProjects();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить проект' })
  @ApiParam({ name: 'id', description: 'ID проекта' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({
    status: 200,
    description: 'Проект успешно обновлен.',
    schema: {
      example: {
        id: 1,
        authorId: 1,
        title: 'Updated Project',
        description: 'Updated description of the project',
        bannerUrl: 'http://example.com/banner_updated.png',
        files: ['file1.png', 'file2.png'],
        tags: ['updatedTag1', 'updatedTag2'],
        category: 'Updated Category Name',
        price: 2000,
        tasks: [
          {
            id: 1,
            title: 'Updated Task 1',
            description: 'Updated description of task 1',
            price: 1000,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса.' })
  @ApiResponse({ status: 404, description: 'Проект не найден.' })
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto
  ): Promise<Project> {
    const projectId = parseInt(id);
    return this.projectService.updateProject(projectId, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить проект' })
  @ApiParam({ name: 'id', description: 'ID проекта' })
  @ApiResponse({ status: 200, description: 'Проект успешно удален.' })
  @ApiResponse({ status: 404, description: 'Проект не найден.' })
  async deleteProject(@Param('id') id: string): Promise<Project> {
    const projectId = parseInt(id);
    return this.projectService.deleteProject(projectId);
  }
}
