import React from 'react';

interface Organization {
  value: string;
  label: string;
}

interface OrganizationPickerProps {
  organizations: Organization[];
  selectedOrganization: string;
  onSelectOrganization: (value: string) => void;
}

export function OrganizationPicker({
  organizations,
  selectedOrganization,
  onSelectOrganization
}: OrganizationPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedOrganization
            ? organizations.find((org) => org.value === selectedOrganization)?.label
            : "Select organization..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandEmpty>No organization found.</CommandEmpty>
          <CommandGroup>
            {organizations.map((org) => (
              <CommandItem
                key={org.value}
                onSelect={(currentValue) => {
                  onSelectOrganization(currentValue === selectedOrganization ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedOrganization === org.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {org.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
