import {
  Box,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Controller, Control, UseFormRegister } from "react-hook-form";

interface ChildSectionProps {
  index: number;
  onRemove: () => void;
  control: Control<any>;
  register: UseFormRegister<any>;
}

const ChildSection = ({
  index,
  onRemove,
  control,
  register,
}: ChildSectionProps) => {
  return (
    <Box className="w-full sm:w-[48%] lg:w-[32%] shadow-md border border-gray-300 p-4 rounded-lg mt-4">
      <Box className="flex flex-col">
        <Box className="w-full flex items-center justify-between gap-2">
          <span className="md:w-[200px] font-bold text-black text-base ">
            Enfant {index + 1}
          </span>
          <Box className="flex-1 flex justify-end">
            <IconButton onClick={onRemove} className="cursor-pointer">
              <DeleteOutlineIcon color="error" />
            </IconButton>
          </Box>
        </Box>

        <Box className="w-full flex flex-col py-2 self-start justify-between gap-4">
          <label className="text-left font-medium">Date de naissance:</label>
          <TextField
            type="date"
            fullWidth
            size="small"
            {...register(`children.${index}.dob`)}
          />
        </Box>

        <Box className="w-full flex flex-col mt-2 self-start justify-between gap-0">
          <label className="text-left font-medium ">Mode d'accouchement:</label>
          <FormControl>
            <Controller
              control={control}
              name={`children.${index}.birthType`}
              defaultValue="naturel"
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel
                    sx={{ mb: -2 }}
                    value="naturel"
                    control={<Radio size="small" />}
                    label="Naturel"
                  />
                  <FormControlLabel
                    value="cesarienne"
                    control={<Radio size="small" />}
                    label="Césarienne"
                  />
                </RadioGroup>
              )}
            />
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default ChildSection;
