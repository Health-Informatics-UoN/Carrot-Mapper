from django.db import migrations


def migrate_status_data_forwards(apps, schema_editor):
    ScanReport = apps.get_model("mapping", "ScanReport")
    UploadStatus = apps.get_model("mapping", "UploadStatus")
    MappingStatus = apps.get_model("mapping", "MappingStatus")

    # Create a mapping of old status values to new UploadStatus and MappingStatus instances
    status_mapping = {
        "UPINPRO": (
            UploadStatus.objects.get(value="IN_PROGRESS"),
            MappingStatus.objects.get(value="PENDING"),
        ),
        "UPCOMPL": (
            UploadStatus.objects.get(value="COMPLETE"),
            MappingStatus.objects.get(value="PENDING"),
        ),
        "UPFAILE": (
            UploadStatus.objects.get(value="FAILED"),
            MappingStatus.objects.get(value="PENDING"),
        ),
        "PENDING": (
            UploadStatus.objects.get(value="COMPLETE"),
            MappingStatus.objects.get(value="PENDING"),
        ),
        "INPRO25": (
            UploadStatus.objects.get(value="COMPLETE"),
            MappingStatus.objects.get(value="MAPPING_25PERCENT"),
        ),
        "INPRO50": (
            UploadStatus.objects.get(value="COMPLETE"),
            MappingStatus.objects.get(value="MAPPING_50PERCENT"),
        ),
        "INPRO75": (
            UploadStatus.objects.get(value="COMPLETE"),
            MappingStatus.objects.get(value="MAPPING_75PERCENT"),
        ),
        "COMPLET": (
            UploadStatus.objects.get(value="COMPLETE"),
            MappingStatus.objects.get(value="COMPLETE"),
        ),
        "BLOCKED": (
            UploadStatus.objects.get(value="COMPLETE"),
            MappingStatus.objects.get(value="BLOCKED"),
        ),
    }

    for report in ScanReport.objects.all():
        if hasattr(report, "status"):  # Check if the old status field exists
            upload_status, mapping_status = status_mapping.get(
                report.status, (None, None)
            )
            print(upload_status, "upload status")
            print(mapping_status, "mapping status")
            if upload_status:
                report.upload_status_id = upload_status.id
                print(report.upload_status_id)
            if mapping_status:
                report.mapping_status_id = mapping_status.id
                print(report.mapping_status_id)
            report.save()


def migrate_status_data_backwards(apps, schema_editor):
    ScanReport = apps.get_model("mapping", "ScanReport")
    UploadStatus = apps.get_model("mapping", "UploadStatus")
    MappingStatus = apps.get_model("mapping", "MappingStatus")

    # Mapping of new status combinations to old status values
    reverse_mapping = {
        ("IN_PROGRESS", "PENDING"): "UPINPRO",
        ("COMPLETE", "PENDING"): "UPCOMPL",
        ("FAILED", "PENDING"): "UPFAILE",
        ("COMPLETE", "PENDING"): "PENDING",
        ("COMPLETE", "MAPPING_25PERCENT"): "INPRO25",
        ("COMPLETE", "MAPPING_50PERCENT"): "INPRO50",
        ("COMPLETE", "MAPPING_75PERCENT"): "INPRO75",
        ("COMPLETE", "COMPLETE"): "COMPLET",
        ("COMPLETE", "BLOCKED"): "BLOCKED",
    }

    for report in ScanReport.objects.all():
        upload_status = (
            UploadStatus.objects.get(id=report.upload_status_id)
            if report.upload_status_id
            else None
        )
        mapping_status = (
            MappingStatus.objects.get(id=report.mapping_status_id)
            if report.mapping_status_id
            else None
        )
        old_status = reverse_mapping.get(
            (upload_status.value, mapping_status.value), "UPINPRO"
        )  # Default to 'UPINPRO' if no match
        report.status = old_status
        report.save()


class Migration(migrations.Migration):

    dependencies = [
        (
            "mapping",
            "0004_mappingstatus_uploadstatus_scanreport_mapping_status_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(
            migrate_status_data_forwards, migrate_status_data_backwards
        ),
    ]
