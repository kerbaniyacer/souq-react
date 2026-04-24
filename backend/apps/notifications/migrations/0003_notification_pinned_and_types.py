from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_add_new_notification_types'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='is_pinned',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterModelOptions(
            name='notification',
            options={
                'ordering': ['-is_pinned', '-created_at'],
                'verbose_name': 'إشعار',
                'verbose_name_plural': 'الإشعارات',
            },
        ),
    ]
