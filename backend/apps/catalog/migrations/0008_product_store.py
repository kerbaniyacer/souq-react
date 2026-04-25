from django.db import migrations, models
import django.db.models.deletion


def link_products_to_stores(apps, schema_editor):
    Product = apps.get_model('catalog', 'Product')
    Store = apps.get_model('accounts', 'Store')
    for product in Product.objects.select_related('seller').iterator():
        store = Store.objects.filter(owner=product.seller).first()
        if store:
            Product.objects.filter(pk=product.pk).update(store=store)


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0007_add_series'),
        ('accounts', '0012_store'),
    ]
    operations = [
        migrations.AddField(
            model_name='product',
            name='store',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='products',
                to='accounts.store',
                verbose_name='المتجر',
            ),
        ),
        migrations.RunPython(link_products_to_stores, migrations.RunPython.noop),
    ]
