from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0013_remove_profile_store_category_and_more'),
    ]

    operations = [
        # Remove is_seller column — now a computed @property derived from stores
        migrations.RemoveField(
            model_name='profile',
            name='is_seller',
        ),
    ]
