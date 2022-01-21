# Changelog

Please append a line to the changelog for each change made.

## v1.3-beta
* Scan Report upload page now shows a spinner while uploading a file.
* Scan Reports and Data Dictionaries can be downloaded from the ScanReportTables page
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
