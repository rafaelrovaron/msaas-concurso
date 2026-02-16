import React from 'react'

interface FormInputProps {
    label: string
    type?: string
    placeholder?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FormInput({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
}: FormInputProps) {
    return (
        <div>
            <label className="block text-sm text-gray-600 mb-1">
                {label}
            </label>

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
        </div>
    )
}
