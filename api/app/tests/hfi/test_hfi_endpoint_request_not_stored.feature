Feature: /hfi/

    Scenario: HFI - load request, no request stored
        # In this scenario, we expect a request to be loaded from the database - but there isn't one.
        Given I received a <request_json>, but don't have one stored
        Then the response status code is <status_code>
        And the response is <response_json>
        And request == saved = <request_saved>

        Examples:
            | request_json                                          | status_code | response_json                                     | request_saved |
            # the request doesn't contain a prep date, so we'll try to load it, but there's none saved.
            | test_hfi_endpoint_request_load_no_date_specified.json | 200         | hfi/test_hfi_endpoint_response_not_loaded.json    | False         |
            # the request doesn't contain a valid prep date - so it won't get saved in the database!
            | test_hfi_endpoint_request_save_invalid.json           | 200         | hfi/test_hfi_endpoint_response_save_invalid.json  | False         |
            # this request has a valid prep date, so we expect it to be saved.
            | test_hfi_endpoint_request_save_valid.json             | 200         | hfi/test_hfi_endpoint_response_save_true.json     | True          |
            | test_hfi_endpoint_request_save_valid_239.json         | 200         | hfi/test_hfi_endpoint_response_save_true_239.json | True          |