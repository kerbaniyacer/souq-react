import json
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.catalog.models import Product, VariantImage


class Command(BaseCommand):
    help = 'Import local product images from a JSON manifest and attach them to each product main variant.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--manifest',
            default=str(Path(settings.BASE_DIR) / 'product_image_manifest.json'),
            help='Path to the JSON manifest file.',
        )
        parser.add_argument(
            '--source-dir',
            default=str(Path(settings.MEDIA_ROOT) / 'imports' / 'products'),
            help='Directory containing the source image files.',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Delete existing variant images for a product before importing new ones.',
        )

    def handle(self, *args, **options):
        manifest_path = Path(options['manifest'])
        source_dir = Path(options['source_dir'])
        clear_existing = options['clear_existing']

        if not manifest_path.exists():
            raise CommandError(f'Manifest file not found: {manifest_path}')
        if not source_dir.exists():
            raise CommandError(f'Source directory not found: {source_dir}')

        try:
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as exc:
            raise CommandError(f'Invalid manifest JSON: {exc}') from exc

        if not isinstance(manifest, list):
            raise CommandError('Manifest must be a JSON array.')

        imported_count = 0

        for item in manifest:
            if not isinstance(item, dict):
                self.stdout.write(self.style.WARNING('Skipped invalid manifest entry: not an object'))
                continue

            slug = item.get('slug')
            filenames = item.get('filenames', [])
            alt_text = item.get('alt_text') or ''
            entry_clear_existing = item.get('clear_existing', clear_existing)

            if not slug or not isinstance(filenames, list) or not filenames:
                self.stdout.write(self.style.WARNING(f'Skipped invalid entry for slug={slug!r}'))
                continue

            try:
                product = Product.objects.prefetch_related('variants__images').get(slug=slug)
            except Product.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Skipped missing product: {slug}'))
                continue

            variant = product.variants.filter(is_main=True).first() or product.variants.first()
            if not variant:
                self.stdout.write(self.style.WARNING(f'Skipped {slug}: no variants found'))
                continue

            if entry_clear_existing:
                for image in list(variant.images.all()):
                    image.delete()

            target_dir = Path(settings.MEDIA_ROOT) / 'variants' / product.slug
            target_dir.mkdir(parents=True, exist_ok=True)

            for index, filename in enumerate(filenames):
                source_file = source_dir / filename
                if not source_file.exists():
                    self.stdout.write(self.style.WARNING(f'Skipped missing file for {slug}: {filename}'))
                    continue

                target_file = target_dir / source_file.name
                if source_file.resolve() != target_file.resolve():
                    shutil.copy2(source_file, target_file)

                image = VariantImage.objects.create(
                    product=product,
                    image=str(Path('variants') / product.slug / target_file.name).replace('\\', '/'),
                    alt_text=alt_text or product.name,
                    is_main=index == 0,
                )
                image.variants.add(variant)
                imported_count += 1

        self.stdout.write(self.style.SUCCESS(f'Imported {imported_count} product images.'))
