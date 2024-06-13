import { Field, FieldInputProps, FieldProps, FormikProps } from "formik";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import config from "@/tailwind.config";

type Option = Object & {
  value: number;
  label: string;
};

const CustomSelect = ({
  field,
  form,
  isMulti = false,
  options,
  placeholder,
  isDisabled,
}: {
  options: Option[];
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
        multiValueLabel: (base) => ({
          ...base,
          fontSize: "17px",
          backgroundColor: `${config.theme.extend.colors.carrot.DEFAULT}`, // Can't import directly "carrot" color here
          color: "white",
        }),
        multiValueRemove: (base) => ({
          ...base,
          backgroundColor: `${config.theme.extend.colors.carrot.DEFAULT}`,
          color: "white",
          fontSize: "17px",
        }),
        singleValue: (base) => ({
          ...base,
          fontSize: "17px",
          color: `${config.theme.extend.colors.carrot.DEFAULT}`,
        }),
      }}
    />
  );
};

export const FormikSelect = ({
  options,
  name,
  placeholder,
  isMulti,
  isDisabled,
}: {
  options: Option[];
  name: string;
  placeholder: string;
  isMulti: boolean;
  isDisabled: boolean;
}) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps<any>) => (
        <CustomSelect
          field={field}
          form={form}
          isMulti={isMulti}
          options={options}
          placeholder={placeholder}
          isDisabled={isDisabled}
        />
      )}
    </Field>
  );
};
