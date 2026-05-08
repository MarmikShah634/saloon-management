from decimal import Decimal
from uuid import UUID
from sqlalchemy import func, or_, select
from app.models.saloon import Saloon
from app.models.enums import SaloonStatus
from app.repositories.base import BaseRepository


class SaloonRepository(BaseRepository[Saloon]):
    model = Saloon

    async def get_by_id(self, id_: UUID | str) -> Saloon | None:
        q = select(Saloon).where(Saloon.id == id_, Saloon.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Saloon | None:
        q = select(Saloon).where(Saloon.slug == slug, Saloon.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def list_saloons(
        self,
        q: str | None = None,
        city: str | None = None,
        lat: Decimal | None = None,
        lng: Decimal | None = None,
        radius_km: float | None = None,
        status: SaloonStatus | None = None,
        sort: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Saloon], int]:
        base = select(Saloon).where(Saloon.deleted_at.is_(None))

        if q:
            base = base.where(
                or_(
                    Saloon.name.ilike(f"%{q}%"),
                    Saloon.city.ilike(f"%{q}%"),
                    Saloon.address.ilike(f"%{q}%"),
                )
            )
        if city:
            base = base.where(Saloon.city == city)
        if status:
            base = base.where(Saloon.status == status.value)
        if lat is not None and lng is not None and radius_km is not None:
            # Bounding box approximation (1 deg lat ~ 111 km)
            lat_delta = Decimal(str(radius_km / 111.0))
            lng_delta = Decimal(str(radius_km / (111.0 * float(abs(lat) * 0.0175 + 0.0001 + 1))))
            base = base.where(
                Saloon.lat.between(lat - lat_delta, lat + lat_delta),
                Saloon.lng.between(lng - lng_delta, lng + lng_delta),
            )

        allowed_sorts = {"name": Saloon.name, "created_at": Saloon.created_at}
        if sort:
            desc = sort.startswith("-")
            field_name = sort.lstrip("-")
            if field_name in allowed_sorts:
                col = allowed_sorts[field_name]
                base = base.order_by(col.desc() if desc else col.asc())

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        rows = (await self.db.execute(base.offset((page - 1) * size).limit(size))).scalars().all()
        return list(rows), total
