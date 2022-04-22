# Changelog

Please append a line to the changelog for each change made.

## v2.0.0-beta

- Added Project and Dataset tables to the database.
- Added `add_datasets_to_partner` management command.
- Removed data_partner field from ScanReport. Added data_partner field to Dataset.
  - **IMPORTANT!** Steps to enact this change:
    1. Create a migrations to add data_partner field to **Dataset**. Allow the field to be NULL.
    2. Run the `add_datasets_to_partner` command.
    3. Create a migration to remove the data_partner field from **ScanReport** and remove the NULL constraint from data_partner from **Dataset**.

* Added visibility restrictions to Datasets and Scan Reports.
  - "PUBLIC": anyone on the Project can view the Dataset or Scan Report.
  - "RESTRICTED": only users in the `viewers` field of the Dataset or Scan Report can view.
  - **IMPORTANT!** Steps to enact this change:
    1. Create a migration to add the `visibility` flag to **Dataset**. Set default to "PUBLIC".
    2. Create a migration adding a `ManyToManyField` called `viewers` to **Dataset** linking it to `settings.AUTH_USER_MODEL`.
    3. Create a migration to add the `visibility` flag to **ScanReport**. Set default to "PUBLIC".
    4. Create a migration adding a `ManyToManyField` called `viewers` to **ScanReport** linking it to `settings.AUTH_USER_MODEL`.
* Implemented admins and associated permissions to Datasets.
  - Admins can update and delete Datasets.
  - **IMPORTANT!** Steps to enact this change:
    1. Create a migration adding a `ManyToManyField` called `admins` to **Dataset** linking it to `settings.AUTH_USER_MODEL`.
    2. Run the management command `add_admins_to_datasets` with no arguments to assign a single admin to each existing dataset.
* Added API views for updating and deleting Datasets.
  - Use `PATCH` `/api/datasets/update/<dataset id>` to update.
  - Use `DELETE` `/api/datasets/delete/<dataset id>` to delete.
* Added uniqueness check to dataset names
  - **IMPORTANT!** Steps to enact this change:
    1. Create a migration adding `unique=True` to `name` field in **Dataset**.
* Added ability to add dataset to projects related dataset list when creating a dataset inside scanreport upload
* Patched bug where inputs on field and value pages could not be used on small screens by adding width restrictions
* Removed NLP columns on tables
* Use `logging` module in `ProcessQueue`.
* Added "Analyse Concepts" button to Mapping Rules page which looks through each SRs mapping rules and displays any ancestors/descendants that may appear in other Scan Reports, along with a link to the field/value the ancestor/descendant is mapped to.
* Removed ajax functions and replaced with react fetch requests
* Added permissions to view and edit Scan Reports.
* Added admin form for Datasets on frontend.
  - Found at `/datasets/<dataset_id>/details`.
* Implemented editors and associated permissions to Datasets and Scan Reports.
  - Editors of Datasets cannot add or remove viewers, editors or admins. They cannot
    delete Datasets, either.
  - Editors of Scan Reports cannot add or remove viewers, editors. They cannot
    delete Scan Reports, either.
  - **IMPORTANT!** Steps to enact this change:
    1. Create a migration adding a `ManyToManyField` called `editors` to **Dataset** linking it to `settings.AUTH_USER_MODEL`.
    2. Create a migration adding a `ManyToManyField` called `editors` to **ScanReport** linking it to `settings.AUTH_USER_MODEL`.
* Added `arraysEqual` function to the React code to test arrays have all the same values.
* Created new reusable form components:
  - `CCTextInput`: for text inputs.
  - `CCSwitchInput`: for boolean switches.
  - `CCSelectInput`: for selecting a single choice.
  - `CCMultiSelectInput`: for selecting multiple choices.
* Added admin form for Scan Reports on frontend.
  - Found at `/scanreports/<scanreport_id>/details`.
* Added link to scan report details page to scan report list page.
* Added link to scan report details page to scan report tables page.
* Added Datasets content page which displays all the scanreports in a given dataset
* Change the dataset link to go to the dataset content page
* Public Scan Reports under restricted Datasets are only visible to those
  with visibility of the Dataset.
* Added Datasets content page which displays all the scanreports in a given dataset
* Change the dataset link to go to the dataset content page
* Created Dataset List page
  - Display Dataset information (ID, Name, Data Partner, Visibility, Created_at)
  - Link to Datasets list page to navigation bar
  - Link to Scan Report List page for each Dataset
  - Link to Dataset details page for each dataset
* Remove unused ajax POST function.
* Remove unused JS variables.
* Users must now be the author of a Scan Report or an admin of the parent Dataset
  to change the author of a Scan Report.
* Can now include a datasets query in the projects list endpoint to include datasets in the result
* Improved django admin pages' responsiveness and informativeness
* Users who are not admins/editors of a scan report table cannot edit the form data.
* User is now automatically added as admin to Datasets they create.
* Fixed failing unittests.
* Updated endpoints for listing Scan Report tables/fields/values:
  - List for Scan Report tables at: `/scanreports/XXX`.
  - List for Scan Report table fields at: `/scanreports/XXX/tables/YYY`.
  - List for Scan Report table field values at: `/scanreports/XXX/tables/YYY/fields/ZZZ`.
* Created Error 404 page.
* Added Archive/Active functionality to Dataset page
  - Created new field 'hidden' in Dataset table
* Users without editor or admin permissions on a scan report will not longer see an option to edit the tables, fields, values or concepts.
* Users without editor or admin permissions on an uploaded scan report's selected parent dataset cannot upload the scan report to that dataset.
* User will see a generic error message when they navigate to a dataset or scan report detail/admin page which they do not have permission to view (or it does not exist).

## v1.4.0 was released 02/02/22

- Mapping rules within existing Scan Reports that are (a) set to 'Mapping Complete' and (b) not
  archived will now be reused by new Scan Reports as they are uploaded.
- Scan Reports and Data Dictionaries can be downloaded from the ScanReportTables page
- Creation type has been added to ScanReportConcept model. A database migration is required for this
- Session length set to 24 hours
- Bump Django version to 3.1.14
- Moved creation_type field from MappingRule model to ScanreportConcept. This will require a migration

## v1.3.0 was released 07/12/21

- Scan Report uploads are massively sped up by using asynchronous requests.
- Data dictionaries are now handled in a more robust manner in upload.
- Scan Report upload page now shows a spinner while uploading a file.
- All users can now archive Scan Reports, not just their own.
- Mapping Rules can now be downloaded in CSV format.
- Mapping Rules table now shows Concept Name alongside Concept ID.
- Summary view added to mapping rules page
- ScanReportField model has been modified to set a number of default values. A database migration is required for this
- The Document, DocumentFile and DocumentType models have been deleted, along with all associated functionality. A database migration is required for this
- StructuralMappingRule has been renamed to MappingRule. A database migration is required for this
- Data in api/initial_data has all been removed.
- tasks.py, services.py and mergedictionary.html removed.
- json-schema package version updated.

## v1.2.2 was released 18/11/21

- Improved performance of Scan Report uploads
- Added a bar chart to the home screen
- Bugfix: fixed an issue where GET requests failed when using Safari
- Upgraded dependencies to avoid known CVEs.

## v1.2 was released 29/10/21

- Status field added to the ScanReport Model and migrations have been applied to ccnetapptestdb. For dev, prod and test system migrations will need to apply.
- Scan Reports no longer need Flag or Classification columns on Field Overview sheet.
- Scan Report upload now runs fast checks on the file and returns feedback to the user if malformed.
- Dashboard of scan report summary stats has been added to the home screen
- New endpoints added to aid the calculation of summary stats.
- Bugfix: Data dictionary now makes use of the table column.
- Scan Report upload now sets Status automatically on start/complete/fail.
- Bugfix: Scan Report upload now handles Nones in supplied spreadsheets.
- Scan Report upload can handle the removal of BOM from dictionary file if present.
- Bugfix: concepts were not being correctly filtered by object type in React display. This is now fixed.

## v1.1 was released 24/09/21

- Mapping rules json structural change, now objects associated to a CDM table are a dictionary (with a key name) rather than just a list.
- Add ReactJS functionality for values view, including use of snowpack.
- All ScanReport API endpoints support filtering on return fields.
- Mapping rules generation and display vastly sped up.
- NVM used to install npm/Node rather than relying on system packages.
- ProcessQueue made more robust to errors, with more helpful outputs.
- API endpoints updates to return records for a list of ids in a table (This is done for tables like: structuralmappingrule, concept, omopfield,omoptable,scanreporttable,scanreportfield,scanreportvalue and scanreportconcept)
- ProcessQueue reads in PAGE_MAX_CHARS from the environment to set the max number of chars in a POST request.
- Pages using REACT now includes Values,Fields,Tables,Mapping Rules,Edit Table,Edit Field, Scan Reports
- Upgrade django to 3.1.13

## v1.0.0 was released 01/09/21
