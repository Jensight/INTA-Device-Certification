import { SingleUnitTimePipe } from './single-unit-time.pipe';
import { TimeDifferencePipe } from './time-diffrence.pipe';
import { TestbedNamePipe } from './testbed-name.pipe';
import { TestbedSearchPipe } from './testbed-search.pipe';
import { DeviceSearchPipe } from './device-search.pipe';
import { ListfilterPipe } from './list-filter.pipe';
import { ModelListPipe } from './model-list.pipe';
import { TestbedConfigureCheckPipe } from './testbed-configure-check.pipe';
import { LimitToPipe } from './limit-to.pipe';
import { DeviceFilterPipe } from './device-filter.pipe';
import { VariableValue } from './api-variable.pipe';
import { VariableDisable } from './variable-disable.pipe';
import { ExtarctAPIPipe } from './extract-api.pipe';
import { NamesFromIdsPipe } from './names-from-ids.pipe';
import { NameFromIdPipe } from './name-from-id.pipe';
import { ExtarctAPIArgumentPipe } from './extract-arguments.pipe';
import { ExtarctAPIArgumentValuePipe } from './extract-argument-value.pipe';
import { NumberToListPipe } from './number-to-list.pipe';
import { TestCasePipeByGroup } from './testcase.pipe';
import { FilterByPipe } from './filterby.pipe';
import { ModelVariableNameExtractPipe } from './model-variable-name-extract.pipe';
import { DateAgoByDatePipe } from './date-ago-by-date.pipe';
import { UsernameByIdPipe } from './username-by-id.pipe';
import { GeneratePassword } from './generate-password.pipe';
import { EncryptPassword } from './encrypt-password.pipe';
import { DecryptPassword } from './decrypt-password.pipe';
import { SearchtestbedpipePipe } from './searchtestbedpipe.pipe';
import { SearchtestsuitePipe } from './searchtestsuite.pipe';

export const SHARED_PIPES = [
    ModelListPipe,
    TestbedConfigureCheckPipe,
    LimitToPipe,
    VariableValue,
    DeviceFilterPipe,
    VariableDisable,
    ExtarctAPIPipe,
    NamesFromIdsPipe,
    NameFromIdPipe,
    ExtarctAPIArgumentPipe,
    ExtarctAPIArgumentValuePipe,
    NumberToListPipe,
    TestCasePipeByGroup,
    FilterByPipe,
    ListfilterPipe,
    DeviceSearchPipe,
    TestbedSearchPipe,
    TestbedNamePipe,
    TimeDifferencePipe,
    SingleUnitTimePipe,
    ModelVariableNameExtractPipe,
    UsernameByIdPipe,
    DateAgoByDatePipe,
    GeneratePassword,
    EncryptPassword,
    DecryptPassword,
    SearchtestbedpipePipe,
    SearchtestsuitePipe
];
