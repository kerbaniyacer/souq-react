import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.catalog.models import Product, VariantImage


IMAGE_MAP = {
    'bluetooth-headphones': {
        'SAM-HP-001-BLK': 'headphones-5-bluetooth-black.png',
        'SAM-HP-001-WHT': 'headphones-5-bluetooth-white.png',
    },
    'classic-gold-watch': {
        'WATCH-GLD-002-G': 'classic-gold-watch-gold.png',
        'WATCH-GLD-002-S': 'classic-gold-watch-silver.png',
    },
    'smartphone-128gb': {
        'SAM-PHN-003-128-BLK': 'smartphone-128gb-black.png',
        'SAM-PHN-003-256-WHT': 'smartphone-256gb-white.png',
    },
    'pro-laptop-16': {
        'APL-LPT-004-512-SLV': 'pro-laptop-16-silver.png',
        'APL-LPT-004-1TB-GRY': 'pro-laptop-16-gray.png',
    },
    'sports-set': {
        'ADI-SET-006-S-BLU': 'sports-set-s-blue.png',
        'ADI-SET-006-M-BLU': 'sports-set-m-blue.png',
        'ADI-SET-006-L-BLK': 'sports-set-l-black.png',
    },
    'cotton-shirt': {
        'MEN-SHT-007-M-WHT': 'cotton-shirt-m-white.png',
        'MEN-SHT-007-L-LBL': 'cotton-shirt-l-light-blue.png',
        'MEN-SHT-007-XL-GRY': 'cotton-shirt-xl-gray.png',
    },
    'summer-dress': {
        'WOM-DRS-008-S-PNK': 'summer-dress-s-pink.png',
        'WOM-DRS-008-M-YEL': 'summer-dress-m-yellow.png',
    },
    'kitchen-set': {
        'KIT-SET-009-SLV': 'kitchen-set-silver.png',
    },
    'learn-programming': {
        'BK-PROG-010-PRT': 'learn-programming-print.png',
        'BK-PROG-010-PDF': 'learn-programming-pdf.png',
    },
    'robot-vacuum': {
        'HOM-ROB-011-BLK': 'robot-vacuum-black.png',
    },
}


class Command(BaseCommand):
    help = 'Link generated images from public/ to the matching product variants.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source-dir',
            default=str(Path(settings.BASE_DIR).parent / 'public'),
            help='Directory containing generated product images.',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Delete existing variant images for mapped products before linking the new files.',
        )

    def handle(self, *args, **options):
        source_dir = Path(options['source_dir'])
        clear_existing = options['clear_existing']

        if not source_dir.exists():
            raise CommandError(f'Source directory not found: {source_dir}')

        linked_count = 0

        for slug, variant_map in IMAGE_MAP.items():
            try:
                product = Product.objects.prefetch_related('variants__images').get(slug=slug)
            except Product.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Skipped missing product: {slug}'))
                continue

            if clear_existing:
                VariantImage.objects.filter(product=product).delete()

            target_dir = Path(settings.MEDIA_ROOT) / 'variants' / product.slug
            target_dir.mkdir(parents=True, exist_ok=True)

            for variant in product.variants.all():
                filename = variant_map.get(variant.sku)
                if not filename:
                    self.stdout.write(self.style.WARNING(f'Skipped unmapped variant SKU: {variant.sku}'))
                    continue

                source_file = source_dir / filename
                if not source_file.exists():
                    self.stdout.write(self.style.WARNING(f'Missing source image for {variant.sku}: {filename}'))
                    continue

                target_file = target_dir / source_file.name
                if source_file.resolve() != target_file.resolve():
                    shutil.copy2(source_file, target_file)

                image = VariantImage.objects.create(
                    product=product,
                    image=str(Path('variants') / product.slug / target_file.name).replace('\\', '/'),
                    alt_text=f'{product.name} - {variant.name or variant.sku}',
                    is_main=variant.is_main,
                )
                image.variants.add(variant)
                linked_count += 1

        self.stdout.write(self.style.SUCCESS(f'Linked {linked_count} variant images from public/.'))
