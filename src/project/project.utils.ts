import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { PrismaClient, User, UserRole } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library";
const prisma = new PrismaClient();

export async function checkUserRole(user: User, role: UserRole) {
    if (user.role !== role) {
        throw new ForbiddenException(
            `Only users with role ${role} can perform this action`
        )
    }

    
}

export async function checkProjectOwnership(projectId: number, userId: number) {
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    })
    if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`)
    }
    if (project.authorId !== userId) {
        throw new ForbiddenException('You can only modify your own projects')
    }
}

export function countProjectPrice(subtasks) {
    const minPrice = subtasks.reduce((min, subtask) => {
        return Decimal.min(min, new Decimal(subtask.price));
    }, new Decimal(subtasks[0].price));

    const maxPrice = subtasks.reduce((max, subtask) => {
        return Decimal.max(max, new Decimal(subtask.price));
    }, new Decimal(subtasks[0].price));

    return {minPrice: minPrice, maxPrice: maxPrice}
}