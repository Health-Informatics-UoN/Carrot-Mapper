import { Field, FieldInputProps, FieldProps, FormikProps } from "formik";
import Select from "react-select";

type Option = Object & {
  value: number;
  label: string;
};
const CustomSelect = ({
  field,
  form,
  isMulti = false,
  options,
  label,
  placeholder,
}: {
  options: Option[];
  label: string;
  placeholder: string;
  isMulti: boolean;
  field: FieldInputProps<any>;
  form: FormikProps<any>;
}) => {
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
    />
  );
};

export const FormikSelect = ({
  options,
  name,
  placeholder,
  label, // label
  isMulti,
}: {
  options: Option[];
  name: string;
  placeholder: string;
  label: string;
  isMulti: boolean;
}) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps<any>) => (
        <CustomSelect
          field={field}
          form={form}
          isMulti={isMulti}
          options={options}
          label={label}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
};
