"""Shared rate limiter instance.

Kept in its own module (rather than defined in main.py) so endpoint modules
can import it directly to add per-route limits, without creating a circular
import back through main.py -> router -> endpoints -> main.py.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])
