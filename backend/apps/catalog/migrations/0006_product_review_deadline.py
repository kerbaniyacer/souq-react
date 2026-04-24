from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0005_remove_product_is_owner_product_appeal_deadline_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='review_deadline',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='product',
            name='status',
            field=models.CharField(
                choices=[
                    ('active', 'Active'),
                    ('under_review', 'Under Review'),
                    ('suspended', 'Suspended'),
                    ('pending_delete', 'Pending Delete'),
                    ('deleted', 'Deleted'),
                ],
                default='active',
                max_length=20,
            ),
        ),
    ]
