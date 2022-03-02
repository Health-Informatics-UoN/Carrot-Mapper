# Changelog

Please append a line to the changelog for each change made.

## v1.5.0-beta
* Added Project and Dataset tables to the database.
* Added `add_datasets_to_partner` management command.
* Removed data_partner field from ScanReport. Added data_partner field to Dataset.
  * __IMPORTANT!__ Steps to enact this change:
    1. Create a migrations to add data_partner field to __Dataset__. Allow the field to be NULL.
    2. Run the `add_datasets_to_partner` command.
    3. Create a migration to remove the data_partner field from __ScanReport__ and remove the NULL constraint from data_partner from __Dataset__.
* Added visibility restrictions to Datasets and Scan Reports.
  * "PUBLIC": anyone on the Project can view the Dataset or Scan Report.
  * "RESTRICTED": only users in the `viewers` field of the Dataset or Scan Report can view.
  * __IMPORTANT!__ Steps to enact this change:
    1. Create a migration to add the `visibility` flag to __Dataset__. Set default to "PUBLIC".
    2. Create a migration adding a `ManyToManyField` called `viewers` to __Dataset__ linking it to `settings.AUTH_USER_MODEL`.
    3. Create a migration to add the `visibility` flag to __ScanReport__. Set default to "PUBLIC".
    4. Create a migration adding a `ManyToManyField` called `viewers` to __ScanReport__ linking it to `settings.AUTH_USER_MODEL`.
* Added ability to add dataset to projects related dataset list when creating a dataset inside scanreport upload

## v1.4.0 was released 02/02/22
* Mapping rules within existing Scan Reports that are (a) set to 'Mapping Complete' and (b) not 
  archived will now be reused by new Scan Reports as they are uploaded.
* Scan Reports and Data Dictionaries can be downloaded from the ScanReportTables page
* Creation type has been added to ScanReportConcept model. A database migration is required for this
* Session length set to 24 hours
* Bump Django version to 3.1.14
* Moved creation_type field from MappingRule model to ScanreportConcept. This will require a migration

## v1.3.0 was released 07/12/21
* Scan Report uploads are massively sped up by using asynchronous requests.
* Data dictionaries are now handled in a more robust manner in upload.
* Scan Report upload page now shows a spinner while uploading a file.
* All users can now archive Scan Reports, not just their own.
* Mapping Rules can now be downloaded in CSV format.
* Mapping Rules table now shows Concept Name alongside Concept ID.
* Summary view added to mapping rules page
* ScanReportField model has been modified to set a number of default values. A database migration is required for this
* The Document, DocumentFile and DocumentType models have been deleted, along with all associated functionality. A database migration is required for this
* StructuralMappingRule has been renamed to MappingRule. A database migration is required for this
* Data in api/initial_data has all been removed.
* tasks.py, services.py and mergedictionary.html removed.
* json-schema package version updated.

## v1.2.2 was released 18/11/21
* Improved performance of Scan Report uploads
* Added a bar chart to the home screen
* Bugfix: fixed an issue where GET requests failed when using Safari
* Upgraded dependencies to avoid known CVEs. 

## v1.2 was released 29/10/21
* Status field added to the ScanReport Model and migrations have been applied to ccnetapptestdb. For dev, prod and test system migrations will need to apply. 
* Scan Reports no longer need Flag or Classification columns on Field Overview sheet.
* Scan Report upload now runs fast checks on the file and returns feedback to the user if malformed.
* Dashboard of scan report summary stats has been added to the home screen
* New endpoints added to aid the calculation of summary stats.
* Bugfix: Data dictionary now makes use of the table column.
* Scan Report upload now sets Status automatically on start/complete/fail.
* Bugfix: Scan Report upload now handles Nones in supplied spreadsheets.
* Scan Report upload can handle the removal of BOM from dictionary file if present.
* Bugfix: concepts were not being correctly filtered by object type in React display. This is now fixed.

## v1.1 was released 24/09/21
* Mapping rules json structural change, now objects associated to a CDM table are a dictionary (with a key name) rather than just a list.
* Add ReactJS functionality for values view, including use of snowpack.
* All ScanReport API endpoints support filtering on return fields.
* Mapping rules generation and display vastly sped up.
* NVM used to install npm/Node rather than relying on system packages.
* ProcessQueue made more robust to errors, with more helpful outputs.
* API endpoints updates to return records for a list of ids in a table (This is done for tables like: structuralmappingrule, concept, omopfield,omoptable,scanreporttable,scanreportfield,scanreportvalue and scanreportconcept)
* ProcessQueue reads in PAGE_MAX_CHARS from the environment to set the max number of chars in a POST request.
* Pages using REACT now includes Values,Fields,Tables,Mapping Rules,Edit Table,Edit Field, Scan Reports
* Upgrade django to 3.1.13

## v1.0.0 was released 01/09/21
