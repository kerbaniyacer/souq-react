from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


def create_stores_from_profiles(apps, schema_editor):
    Profile = apps.get_model('accounts', 'Profile')
    Store = apps.get_model('accounts', 'Store')
    for profile in Profile.objects.filter(is_seller=True).select_related('user'):
        name = profile.store_name or f'{profile.user.username} Store'
        base = slugify(name) or f'store-{profile.user.id}'
        slug, n = base, 1
        while Store.objects.filter(slug=slug).exists():
            slug = f'{base}-{n}'
            n += 1
        Store.objects.get_or_create(
            owner=profile.user,
            defaults={
                'name': name,
                'slug': slug,
                'description': profile.store_description or '',
                'category': profile.store_category or '',
                'rating': profile.seller_rating or 0,
                'reviews_count': profile.seller_reviews_count or 0,
            }
        )


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0011_user_last_seen'),
    ]
    operations = [
        migrations.CreateModel(
            name='Store',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200, verbose_name='اسم المتجر')),
                ('slug', models.SlugField(blank=True, max_length=250, unique=True, verbose_name='الرابط')),
                ('description', models.TextField(blank=True, default='', verbose_name='الوصف')),
                ('logo', models.ImageField(blank=True, null=True, upload_to='stores/logos/', verbose_name='الشعار')),
                ('category', models.CharField(blank=True, default='', max_length=100, verbose_name='تصنيف المتجر')),
                ('status', models.CharField(choices=[('active', 'نشط'), ('suspended', 'موقوف')], default='active', max_length=20, verbose_name='الحالة')),
                ('rating', models.DecimalField(decimal_places=2, default=0, max_digits=3, verbose_name='التقييم')),
                ('reviews_count', models.PositiveIntegerField(default=0, verbose_name='عدد التقييمات')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='stores',
                    to='accounts.user',
                    verbose_name='المالك',
                )),
            ],
            options={
                'verbose_name': 'متجر',
                'verbose_name_plural': 'المتاجر',
                'ordering': ['-created_at'],
            },
        ),
        migrations.RunPython(create_stores_from_profiles, migrations.RunPython.noop),
    ]
