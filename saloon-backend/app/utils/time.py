from datetime import datetime, timedelta, timezone


def ceil_to_grid(dt: datetime, step_min: int) -> datetime:
    minutes = dt.minute
    rem = minutes % step_min
    if rem == 0 and dt.second == 0 and dt.microsecond == 0:
        return dt
    add = step_min - rem
    return dt.replace(second=0, microsecond=0) + timedelta(minutes=add)


def subtract_intervals(
    windows: list[tuple[datetime, datetime]],
    busy: list[tuple[datetime, datetime]],
) -> list[tuple[datetime, datetime]]:
    """Subtract busy intervals from free windows."""
    if not busy:
        return list(windows)

    result: list[tuple[datetime, datetime]] = []
    for w_start, w_end in windows:
        free_segments = [(w_start, w_end)]
        for b_start, b_end in busy:
            new_segments: list[tuple[datetime, datetime]] = []
            for seg_start, seg_end in free_segments:
                if b_end <= seg_start or b_start >= seg_end:
                    new_segments.append((seg_start, seg_end))
                else:
                    if b_start > seg_start:
                        new_segments.append((seg_start, b_start))
                    if b_end < seg_end:
                        new_segments.append((b_end, seg_end))
            free_segments = new_segments
        result.extend(free_segments)
    return result


def merge_intervals(intervals: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
    """Sort and merge overlapping intervals."""
    if not intervals:
        return []
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged: list[tuple[datetime, datetime]] = [sorted_intervals[0]]
    for start, end in sorted_intervals[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged
