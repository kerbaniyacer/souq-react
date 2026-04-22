from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.catalog.models import Product, VariantImage


class Command(BaseCommand):
    help = 'Attach a default image to every product that currently has no variant images.'

    def handle(self, *args, **options):
        source = Path(settings.BASE_DIR).parent / 'public' / 'images' / 'default-product.jpg'
        target_dir = Path(settings.MEDIA_ROOT) / 'variants' / 'defaults'
        target_file = target_dir / 'default-product.jpg'

        if not source.exists():
            raise CommandError(f'Default image not found: {source}')

        target_dir.mkdir(parents=True, exist_ok=True)
        if not target_file.exists():
            target_file.write_bytes(source.read_bytes())

        created_count = 0

        for product in Product.objects.prefetch_related('variants__images').all():
            has_images = any(variant.images.exists() for variant in product.variants.all())
            if has_images:
                continue

            variant = product.variants.filter(is_main=True).first() or product.variants.first()
            if not variant:
                self.stdout.write(self.style.WARNING(f'Skipped product {product.id}: no variants'))
                continue

            image = VariantImage.objects.create(
                product=product,
                image='variants/defaults/default-product.jpg',
                alt_text=f'Default image for {product.name}',
                is_main=True,
            )
            image.variants.add(variant)
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created_count} missing product images.'))
