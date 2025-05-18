<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $patientId = $this->route('Patient');


        return [
            'nom' => ['required'],
            'prenom' => ['required'],
            'cin' => 'nullable',
            'date' => ['required', 'date', 'before_or_equal:today'],
            'address' => ['required'],
            'sex' => ['required', Rule::in(['male', 'female'])],
            'phone_number' => [
                'required',
                'numeric',
                'digits_between:8,12',
                Rule::unique('patients')
                    ->where(fn($query) => $query->where('doctor_id', $this->input('doctor_id')))
                    ->ignore($patientId),
            ],
            'mutuelle' => ['required'],
            'allergy' => ['nullable', 'string'],
            'disease' => ['nullable', 'string'],
            'referral' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'children' => ['nullable', 'array'],
            'children.*.dob' => ['nullable', 'date'],
            'children.*.birthType' => ['required', Rule::in(['naturel', 'cesarienne', 'autre'])],
        ];
    }



    public function prepareForValidation()
    {
        $this->merge([
            'doctor_id' => auth()->user()->doctor_id ?? auth()->id(),
            'phone_number' => $this->phoneNumber,
            'allergy' => isset($this->allergy) ? implode(',', $this->allergy) : null,
            'disease' => isset($this->disease) ? implode(',', $this->disease) : null,
            'referral' => isset($this->referral) ? implode(',', $this->referral) : null,
            'children' => isset($this->children) && isset($this->children[0])
                ? $this->children
                : (isset($this->children) ? [$this->children] : []),
        ]);
    }
}
