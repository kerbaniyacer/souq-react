from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0006_product_review_deadline'),
    ]

    operations = [
        migrations.CreateModel(
            name='Series',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='اسم السلسلة')),
                ('slug', models.SlugField(blank=True, max_length=200, unique=True, verbose_name='الرابط')),
                ('logo', models.ImageField(blank=True, null=True, upload_to='series/', verbose_name='الشعار')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('brand', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='series',
                    to='catalog.brand',
                    verbose_name='العلامة التجارية',
                )),
            ],
            options={
                'verbose_name': 'سلسلة المنتجات',
                'verbose_name_plural': 'سلاسل المنتجات',
                'ordering': ['brand', 'name'],
                'unique_together': {('brand', 'name')},
            },
        ),
        migrations.AddField(
            model_name='product',
            name='series',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='products',
                to='catalog.series',
                verbose_name='السلسلة',
            ),
        ),
    ]
