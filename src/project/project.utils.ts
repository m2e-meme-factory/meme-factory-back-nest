import {
	ForbiddenException,
	NotFoundException,
	InternalServerErrorException
} from '@nestjs/common'
import { PrismaClient, User, UserRole } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { CreateTaskDto } from './dto/project.dto'
const prisma = new PrismaClient()

export async function checkUserRole(user: User, role: UserRole) {
	try {
		if (user.role !== role) {
			throw new ForbiddenException(
				`Only users with role ${role} can perform this action`
			)
		}
	} catch (error) {
		if (error instanceof ForbiddenException) {
			throw error
		} else {
			throw new InternalServerErrorException(
				`Internal server error: ${error.message}`
			)
		}
	}
}

export async function checkProjectOwnership(projectId: number, userId: number) {
	try {
		const project = await prisma.project.findUnique({
			where: { id: projectId }
		})
		if (!project) {
			throw new NotFoundException(`Project with ID ${projectId} not found`)
		}
		if (project.authorId !== userId) {
			throw new ForbiddenException('You can only modify your own projects')
		}
	} catch (error) {
		if (error instanceof ForbiddenException) {
			throw error
		} else {
			throw new InternalServerErrorException(
				`Internal server error: ${error.message}`
			)
		}
	}
}

export function countProjectPrice(subtasks: CreateTaskDto[]) {
	if (subtasks.length === 0) {
		return { minPrice: null, maxPrice: null }
	}

	let minPrice = new Decimal(subtasks[0].price)
	let maxPrice = new Decimal(0)

	for (const subtask of subtasks) {
		const price = new Decimal(subtask.price)
		minPrice = Decimal.min(minPrice, price)
		maxPrice = maxPrice.plus(price)
	}

	return { minPrice, maxPrice }
}
