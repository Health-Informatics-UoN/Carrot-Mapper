# CONTRIBUTION PROCESS
To contribute to this repository, please create a branch on your local
clone, push that branch to the repository, and create a Pull Request (PR)
for that branch. No commits can be directly added onto `master` - all
must come via a Pull Request.

### Reviewers
All PRs must be approved by at least 2 reviewers before they can be merged.
Any team members can act as reviewers, but it is suggested that in general
each PR should have one reviewer from the 'software development' angle, and
one reviewer from the 'data science' angle. All team members (dependent on
their notifications settings) will be notified of new PRs, and are encouraged
to provide additional review comments whenever they can.

### Work items
Please link each PR to a work item from the current sprint. If no work items
are linked, the PR cannot be merged - a new work item should be raised in
order to facilitate capturing the work being done.

If you reference a work item by id in a commit message - e.g. #12345
Fixed issue where data was eaten by a grue - DevOps will auto link the item
to the commit, and therefore the PR.

Otherwise you can manually link items at the point of PR creation, or
afterwards, if necessary.
#DS- Should there be more details added to the branch naming scheme other than the sprint work item number?
#DS- How will the Azure Devops work items and Git by manually linked afterwards if a commit message is not referenced?

### Formatting
Please adhere to PEP8 (https://www.python.org/dev/peps/pep-0008/), the
Python Style Guide. In particular, please

1) Indent with 4 spaces (not tabs).
1) Place 2 blank lines between top-level function and class definitions.
1) Place 1 blank line around method definitions within a class.
1) Place import statements at the top of the file, after any module comments
and docstrings.
1) Include a docstring for each function unless the function is extremely
trivial - if in doubt, err on the side of more documentation. See
https://www.python.org/dev/peps/pep-0257/ for full guidance on writing docstrings.
Note the use of triple-double quotes (""") to start and end docstrings.  

### Testing
All PRs should also contain tests that test the functionality within
the PR.
#DS- What kind of testing package or testing framework should be utilized (e.g. unittest, pytest, robot)? This should be specified.

### Continuous integration
In the near future, Continuous Integration tests will run on each PR, to
ensure that all tests pass before the PR can be merged into `master`.
More details will be available when this is in place.
#DS- More information should be made available for new developers not familiar with CI techniques.
