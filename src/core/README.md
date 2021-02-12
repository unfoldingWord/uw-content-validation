## Core Functions Sandbox


This non-component function can have playgrounds to test them out.

`checkTextField()` does basic checks of a text field.

`checkFieldLinks()` checks text fields that might either be a link or contain one or more links.

`checkTN_TSV9DataRow()` checks a line of tab-separated fields.

Each of the above return a list of error messages
and a list of warning messages.

Each list is a list of two strings:

1. A generic error message
2. A very specific location field.

They're returned like this so that higher-level functions can check for and strip out
multiple repetitions of similar generic error messages if required.

