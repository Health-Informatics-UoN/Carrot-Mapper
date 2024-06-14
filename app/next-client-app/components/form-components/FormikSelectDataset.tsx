import {
  Field,
  FieldInputProps,
  FieldProps,
  FormikProps,
  FormikValues,
  useField,
  useFormikContext,
} from "formik";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import config from "@/tailwind.config";
import { getDataSetList } from "@/api/datasets";
import { useEffect, useState } from "react";

type Option = Object & {
  value: number;
  label: string | undefined;
};

async function fetchDataset(dataPartner: string) {
  const datasets = await getDataSetList(dataPartner);
  return datasets.map((dataset) => ({
    value: dataset.id,
    label: dataset.name,
  }));
}

const CustomSelect = ({
  field,
  form,
  isMulti = false,
  options,
  placeholder,
  isDisabled,
}: {
  options?: Option[];
  placeholder: string;
  isMulti: boolean;
  field: FieldInputProps<any>;
  form: FormikProps<any>;
  isDisabled: boolean;
}) => {
  const animatedComponents = makeAnimated();
  const onChange = (newValue: any, actionMeta: any) => {
    const selectedValues = isMulti
      ? (newValue as Option[]).map((option) => option.value)
      : (newValue as Option).value;

    form.setFieldValue(field.name, selectedValues);
  };

  const selected = () => {
    return options
      ? options.filter((option: Option) =>
          Array.isArray(field.value)
            ? field.value.includes(option.value)
            : field.value === option.value
        )
      : [];
  };

  return (
    <Select
      name={field.name}
      value={selected()}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
      isMulti={isMulti}
      className="w-full"
      isDisabled={isDisabled}
      components={animatedComponents}
      styles={{
        singleValue: (base) => ({
          ...base,
          fontSize: "17px",
          color: `${config.theme.extend.colors.carrot.DEFAULT}`,
        }),
      }}
    />
  );
};

export const FormikSelectDataset = ({
  options,
  name,
  placeholder,
  isMulti,
  isDisabled,
}: {
  options?: Option[];
  name: string;
  placeholder: string;
  isMulti: boolean;
  isDisabled: boolean;
}) => {
  const {
    values: { dataPartner },
  } = useFormikContext<FormikValues>();

  const [datasets, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (dataPartner !== 0) {
        const dataset = await fetchDataset(dataPartner.toString());
        setOptions(dataset);
      }
    };
    fetchData();
  }, [dataPartner]);

  return (
    <Field name={name}>
      {({ field, form }: FieldProps<any>) => (
        <CustomSelect
          field={field}
          form={form}
          isMulti={isMulti}
          options={datasets}
          placeholder={placeholder}
          isDisabled={isDisabled}
        />
      )}
    </Field>
  );
};
