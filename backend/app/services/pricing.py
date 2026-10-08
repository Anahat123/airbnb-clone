"""Price breakdown shown on the listing page, checkout page and saved on bookings.

All amounts are whole rupees. The formula lives here only, so the quote the guest
sees and the amount saved on the booking can never drift apart.
"""

from dataclasses import asdict, dataclass
from datetime import date

from ..config import settings


@dataclass(frozen=True)
class PriceQuote:
    nights: int
    nightly_rate: int
    subtotal: int  # nightly_rate * nights
    cleaning_fee: int
    service_fee: int
    taxes: int
    total: int

    def to_dict(self) -> dict:
        return asdict(self)


def nights_between(check_in: date, check_out: date) -> int:
    return (check_out - check_in).days


def quote(nightly_rate: int, cleaning_fee: int, check_in: date, check_out: date) -> PriceQuote:
    nights = nights_between(check_in, check_out)
    if nights <= 0:
        raise ValueError("Check-out must be after check-in")

    subtotal = nightly_rate * nights
    fee_base = subtotal + cleaning_fee
    service_fee = round(fee_base * settings.service_fee_rate)
    taxes = round(fee_base * settings.tax_rate)
    return PriceQuote(
        nights=nights,
        nightly_rate=nightly_rate,
        subtotal=subtotal,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        taxes=taxes,
        total=fee_base + service_fee + taxes,
    )
