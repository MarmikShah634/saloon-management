from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Select


async def paginate(
    stmt_count: Select,
    stmt_items: Select,
    db: AsyncSession,
    page: int,
    size: int,
) -> tuple[list, int]:
    offset = (page - 1) * size
    total = (await db.execute(stmt_count)).scalar_one()
    rows = (await db.execute(stmt_items.offset(offset).limit(size))).scalars().all()
    return list(rows), total
