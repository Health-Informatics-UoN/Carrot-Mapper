from api.serializers import ContentTypeSerializer
from django.contrib.contenttypes.models import ContentType
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from shared.mapping.models import (
    MappingRule,
    Project,
    ScanReport,
    ScanReportField,
    ScanReportTable,
    ScanReportValue,
)


class GetContentTypeID(APIView):

    def get(self, request, *args, **kwargs):
        """
        Retrieves the content type ID based on the provided type name.

        Args:
            self: The instance of the class.
            request: The HTTP request object.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
        """
        serializer = ContentTypeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        type_name = serializer.validated_data.get("type_name")
        try:
            content_type = ContentType.objects.get(model=type_name)
            return Response({"content_type_id": content_type.id})
        except ContentType.DoesNotExist:
            return Response({"error": "Content type not found"}, status=404)


class CountProjects(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, dataset):
        project_count = (
            Project.objects.filter(datasets__exact=dataset).distinct().count()
        )
        content = {
            "project_count": project_count,
        }
        return Response(content)


class CountStats(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        scanreport_count = ScanReport.objects.count()
        scanreporttable_count = ScanReportTable.objects.count()
        scanreportfield_count = ScanReportField.objects.count()
        scanreportvalue_count = ScanReportValue.objects.count()
        scanreportmappingrule_count = MappingRule.objects.count()
        content = {
            "scanreport_count": scanreport_count,
            "scanreporttable_count": scanreporttable_count,
            "scanreportfield_count": scanreportfield_count,
            "scanreportvalue_count": scanreportvalue_count,
            "scanreportmappingrule_count": scanreportmappingrule_count,
        }
        return Response(content)


class CountStatsScanReport(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        parameterlist = list(
            map(int, self.request.query_params["scan_report"].split(","))
        )
        jsonrecords = []
        scanreporttable_count = "Disabled"
        scanreportfield_count = "Disabled"
        scanreportvalue_count = "Disabled"
        scanreportmappingrule_count = "Disabled"

        for scanreport in parameterlist:
            scanreport_content = {
                "scanreport": scanreport,
                "scanreporttable_count": scanreporttable_count,
                "scanreportfield_count": scanreportfield_count,
                "scanreportvalue_count": scanreportvalue_count,
                "scanreportmappingrule_count": scanreportmappingrule_count,
            }
            jsonrecords.append(scanreport_content)
        return Response(jsonrecords)


class CountStatsScanReportTable(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        parameterlist = list(
            map(int, self.request.query_params["scan_report_table"].split(","))
        )
        jsonrecords = []
        for scanreporttable in parameterlist:
            scanreportfield_count = ScanReportField.objects.filter(
                scan_report_table=scanreporttable
            ).count()
            scanreportvalue_count = ScanReportValue.objects.filter(
                scan_report_field__scan_report_table=scanreporttable
            ).count()

            scanreporttable_content = {
                "scanreporttable": scanreporttable,
                "scanreportfield_count": scanreportfield_count,
                "scanreportvalue_count": scanreportvalue_count,
            }
            jsonrecords.append(scanreporttable_content)
        return Response(jsonrecords)


class CountStatsScanReportTableField(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None):
        parameterlist = list(
            map(int, self.request.query_params["scan_report_field"].split(","))
        )
        jsonrecords = []
        for scanreportfield in parameterlist:
            scanreportvalue_count = ScanReportValue.objects.filter(
                scan_report_field=scanreportfield
            ).count()
            scanreportfield_content = {
                "scanreportfield": scanreportfield,
                "scanreportvalue_count": scanreportvalue_count,
            }
            jsonrecords.append(scanreportfield_content)
        return Response(jsonrecords)
