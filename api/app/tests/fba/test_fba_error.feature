Feature: /fbc/

    Scenario: Fire Behaviour Calculation
        Given <elevation>, <latitude>, <longitude>, <time_of_interest>, <wind_speed>, <wind_direction>, <percentage_conifer>, <percentage_dead_balsam_fir>, <grass_cure>, <crown_base_height>, <isi>, <bui>, <ffmc>, <dmc>, <dc>, <fuel_type>
        Then ROS is within <s_ros_em> of <spreadsheet_ros> with <note>
        And CFB is within <s_cfb_em> of <spreadsheet_cfb> with <note>
        And HFI is within <s_hfi_em> of <spreadsheet_hfi> with <note>
        And ROS is within <r_ros_em> of REDapp ROS
        And CFB is within <r_cfb_em> of REDapp CFB
        And HFI is within <r_hfi_em> of REDapp HFI
        And 1 HR Size is within <r_h1_em> of REDapp 1 HR Size

        # C1 Notes:
        #
        # C1 ROS in CFFDRS is correct (Based on investigation, the result differs from REDapp slightly
        # but the way we call CFFDRS is correct.)
        # C1 CFB requires the date of minimum foliar moisture content to be set to 144 to match the REDapp
        # result.
        # C1 in the coastal spreadsheet is wrong.
        #
        # C3 redapp error margin is off
        # C6 The redapp error margin is horrible (71%-80%)! This must be improved!
        # M1 The redapp error margin is HUGE!
        # M2 The redapp error margin is HUGE!
        # M4 Redapp margin bad.
        # O1A Spreadsheet bad
        # O1B Spreadsheet bad
        # Current target for margin of error: 1% (or 0.01)

        # s_h1_em :- Spreadsheet 1 Hour Error Margin
        # r_h1_em :- REDapp 1 Hour Error Margin
        # s_cfb_em :- Spreadsheet Crown Fraction Burned Error Margin
        # s_hfi_em :- Spreadsheet Head Fire Intensity Error Margin
        Examples:
            | fuel_type | elevation | latitude   | longitude    | time_of_interest | wind_speed | wind_direction | percentage_conifer | percentage_dead_balsam_fir | grass_cure | crown_base_height | isi  | bui   | ffmc | dmc   | dc    | r_h1_em | r_ros_em | r_hfi_em | r_cfb_em | spreadsheet_ros | s_ros_em | spreadsheet_hfi | s_hfi_em | spreadsheet_cfb | s_cfb_em | note                                              |
            | C1        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 2                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.01    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet calculations are faulty.              |
            | C2        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 3                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.34    | 0.01     | 0.01     | 0.01     | 19.26           | 0.01     | 30072.67        | 0.01     | 1.0             | 0.011    |                                                   |
            | C3        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 8                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.09    | 0.01     | 0.03     | 0.14     | 8.21            | 0.01     | 13097.75        | 0.01     | 0.7             | 0.06     |                                                   |
            | C4        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 4                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.33    | 0.01     | 0.01     | 0.01     | 18.77           | 0.01     | 31944.15        | 0.01     | 1.0             | 0.03     |                                                   |
            | C5        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 18                | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.02    | 0.01     | 0.01     | 0.01     | 3.19            | 0.01     | 4081.48         | 0.01     | -7.9            | 0.01     | Spreadsheet gives me -7.9 for CFB!                |
            | C6        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 7                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 2.29    | 0.75     | 0.8      | 0.09     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do C6                         |
            | C6        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 2                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 1.74    | 0.7      | 0.71     | 0.03     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do C6; Fire size got worse... |
            | C7        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | 10                | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.24    | 0.01     | 0.01     | 0.01     | 4.07            | 0.01     | 4089.57         | 0.0105   | -0.9            | 0.01     | Spreadsheet has a negative CFB!                   |
            | D1        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 100                | None                       | None       | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.31    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do D1                         |
            | M1        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 75                 | None                       | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.32    | 0.01     | 0.01     | 0.013    | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M1                         |
            | M1        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 50                 | None                       | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.3     | 0.01     | 0.01     | 0.06     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M1                         |
            | M1        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 25                 | None                       | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.94    | 0.08     | 0.096    | 0.63     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M1                         |
            | M2        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 75                 | None                       | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.32    | 0.01     | 0.01     | 0.015    | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M2                         |
            | M2        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 50                 | None                       | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.28    | 0.01     | 0.01     | 0.08     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M2                         |
            | M2        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | 25                 | None                       | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.47    | 0.01     | 0.031    | 2.8      | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M2                         |
            | M3        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | 30                         | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.38    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M3                         |
            | M3        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | 60                         | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.39    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M3                         |
            | M3        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | 100                        | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.39    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M3                         |
            | M4        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | 30                         | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.31    | 0.01     | 0.01     | 0.06     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M4                         |
            | M4        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | 60                         | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.35    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M4                         |
            | M4        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | 100                        | None       | 6                 | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.35    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do M4                         |
            | O1A       | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | 25         | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.43    | 0.01     | 0.01     | 0.01     | 0.63            | 0.01     | 56.94           | 0.17     | None            | 0.01     |                                                   |
            | O1A       | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | 50         | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.37    | 0.01     | 0.01     | 0.01     | 3.54            | 0.01     | 318.58          | 0.17     | None            | 0.01     |                                                   |
            | O1A       | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | 100        | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.37    | 0.01     | 0.01     | 0.01     | 35.19           | 0.01     | 3167.51         | 0.17     | None            | 0.01     |                                                   |
            | O1B       | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | 25         | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.38    | 0.01     | 0.01     | 0.01     | 0.63            | 0.1      | 56.94           | 0.27     | None            | 0.01     |                                                   |
            | O1B       | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | 50         | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.31    | 0.01     | 0.01     | 0.01     | 3.54            | 0.09     | 318.58          | 0.27     | None            | 0.01     |                                                   |
            | O1B       | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | 100        | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.31    | 0.01     | 0.01     | 0.01     | 17.60           | 1.18     | 1583.75         | 1.54     | None            | 0.01     |                                                   |
            | S1        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | None       | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.39    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do S1                         |
            | S2        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | None       | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.32    | 0.01     | 0.01     | 0.01     | None            | 0.01     | None            | 0.01     | None            | 0.01     | Spreadsheet doesn't do S2                         |
            | S3        | 780       | 50.6733333 | -120.4816667 | 2021-07-12       | 6.2        | 3              | None               | None                       | None       | None              | 11.5 | 186.8 | 94.8 | 126.1 | 900.3 | 0.14    | 0.01     | 0.01     | 0.01     | 17.05           | 0.01     | 158929.49       | 0.01     | None            | 0.01     |                                                   |