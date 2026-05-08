"""Unit tests for time utilities: subtract_intervals, ceil_to_grid, slot algorithm."""
from datetime import datetime, timedelta, timezone
import pytest
from app.utils.time import ceil_to_grid, subtract_intervals, merge_intervals


def dt(hour: int, minute: int = 0) -> datetime:
    return datetime(2025, 1, 1, hour, minute, 0, tzinfo=timezone.utc)


class TestCeilToGrid:
    def test_already_on_grid(self):
        d = dt(9, 0)
        assert ceil_to_grid(d, 5) == d

    def test_needs_rounding_up(self):
        d = dt(9, 3)
        assert ceil_to_grid(d, 5) == dt(9, 5)

    def test_exactly_on_boundary(self):
        d = dt(9, 10)
        assert ceil_to_grid(d, 10) == dt(9, 10)

    def test_1_minute_over(self):
        d = dt(9, 1)
        assert ceil_to_grid(d, 5) == dt(9, 5)

    def test_4_minutes_over(self):
        d = dt(9, 4)
        assert ceil_to_grid(d, 5) == dt(9, 5)

    def test_has_seconds(self):
        d = datetime(2025, 1, 1, 9, 0, 30, tzinfo=timezone.utc)
        result = ceil_to_grid(d, 5)
        assert result == dt(9, 5)


class TestSubtractIntervals:
    def test_no_busy(self):
        windows = [(dt(9), dt(12))]
        result = subtract_intervals(windows, [])
        assert result == [(dt(9), dt(12))]

    def test_busy_covers_whole_window(self):
        windows = [(dt(9), dt(12))]
        busy = [(dt(8), dt(13))]
        result = subtract_intervals(windows, busy)
        assert result == []

    def test_busy_at_start(self):
        windows = [(dt(9), dt(12))]
        busy = [(dt(9), dt(10))]
        result = subtract_intervals(windows, busy)
        assert result == [(dt(10), dt(12))]

    def test_busy_in_middle(self):
        windows = [(dt(9), dt(12))]
        busy = [(dt(10), dt(11))]
        result = subtract_intervals(windows, busy)
        assert len(result) == 2
        assert result[0] == (dt(9), dt(10))
        assert result[1] == (dt(11), dt(12))

    def test_busy_at_end(self):
        windows = [(dt(9), dt(12))]
        busy = [(dt(11), dt(12))]
        result = subtract_intervals(windows, busy)
        assert result == [(dt(9), dt(11))]

    def test_fully_booked(self):
        windows = [(dt(9), dt(17))]
        busy = [
            (dt(9), dt(10)),
            (dt(10), dt(12)),
            (dt(12), dt(14)),
            (dt(14), dt(17)),
        ]
        result = subtract_intervals(windows, busy)
        assert result == []

    def test_partial_booked(self):
        windows = [(dt(9), dt(17))]
        busy = [(dt(10), dt(11)), (dt(13), dt(14))]
        result = subtract_intervals(windows, busy)
        assert (dt(9), dt(10)) in result
        assert (dt(11), dt(13)) in result
        assert (dt(14), dt(17)) in result


class TestMergeIntervals:
    def test_no_intervals(self):
        assert merge_intervals([]) == []

    def test_non_overlapping(self):
        intervals = [(dt(9), dt(10)), (dt(11), dt(12))]
        result = merge_intervals(intervals)
        assert result == [(dt(9), dt(10)), (dt(11), dt(12))]

    def test_overlapping(self):
        intervals = [(dt(9), dt(11)), (dt(10), dt(12))]
        result = merge_intervals(intervals)
        assert result == [(dt(9), dt(12))]

    def test_adjacent(self):
        intervals = [(dt(9), dt(10)), (dt(10), dt(11))]
        result = merge_intervals(intervals)
        assert result == [(dt(9), dt(11))]


class TestSlotAlgorithm:
    """Tests for the slot algorithm logic (without DB)."""

    def test_slot_generation_basic(self):
        from app.utils.time import subtract_intervals, ceil_to_grid

        windows = [(dt(9), dt(11))]
        busy: list = []
        free = subtract_intervals(windows, busy)

        step = timedelta(minutes=30)
        duration = timedelta(minutes=30)
        results = []
        for w_start, w_end in free:
            t = ceil_to_grid(w_start, 30)
            while t + duration <= w_end:
                results.append(t)
                t += step

        assert dt(9) in results
        assert dt(9, 30) in results
        assert dt(10) in results
        assert dt(10, 30) in results  # 10:30 + 30min = 11:00 which is exactly the end boundary (<=)

    def test_slot_with_buffer(self):
        windows = [(dt(9), dt(12))]
        booking_end = dt(10)
        buffer = timedelta(minutes=10)
        busy = [(dt(9), booking_end + buffer)]  # 9:00-10:10

        free = subtract_intervals(windows, busy)
        step = timedelta(minutes=5)
        duration = timedelta(minutes=30)
        results = []
        for w_start, w_end in free:
            t = ceil_to_grid(w_start, 5)
            while t + duration <= w_end:
                results.append(t)
                t += step
        # First available slot should be at 10:10
        assert dt(10, 10) in results
        assert dt(9, 0) not in results
