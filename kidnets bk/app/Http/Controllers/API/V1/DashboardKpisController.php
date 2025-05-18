<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SearchOperationDebtResource;
use App\Models\Appointment;
use App\Models\Operation;
use App\Models\outsourceOperation;
use App\Models\Patient;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\UserPreference;
use App\Models\WaitingRoomLogs;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardKpisController extends Controller
{
    use HttpResponses;
    use UserRoleCheck;
    public function getAppointments()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        $startDate = null;
        $endDate = null;
        switch ($userPreference) {
            case 'monthly':
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                break;
            case 'weekly':
                $startDate = Carbon::now()->startOfWeek();
                $endDate = Carbon::now()->endOfWeek();
                break;
            case 'daily':
                $startDate = Carbon::today();
                $endDate = Carbon::today()->endOfDay();
                break;
            default:
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                break;
        }
        $data = Appointment::where('doctor_id', $doctorId)->whereBetween('created_at', [$startDate, $endDate])->count();

        return response()->json(['data' => $data]);
    }

    public function getCanceledAppointments()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        $startDate = null;
        $endDate = null;
        switch ($userPreference) {
            case 'monthly':
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                break;
            case 'weekly':
                $startDate = Carbon::now()->startOfWeek();
                $endDate = Carbon::now()->endOfWeek();
                break;
            case 'day':
                $startDate = Carbon::today();
                $endDate = Carbon::today()->endOfDay();
                break;
            case 'yearly':
                $startDate = Carbon::now()->startOfYear();
                $endDate = Carbon::now()->endOfYear();
                break;
            default:
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                break;
        }

        $data = Appointment::where('doctor_id', $doctorId)->whereBetween('created_at', [$startDate, $endDate])->withTrashed()->whereNotNull('deleted_at')->count();
        return response()->json(['data' => $data]);
    }
    public function getAppointmentCancellationRate()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        $startDate = null;
        $endDate = null;
        switch ($userPreference) {
            case 'monthly':
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                break;
            case 'weekly':
                $startDate = Carbon::now()->startOfWeek();
                $endDate = Carbon::now()->endOfWeek();
                break;
            case 'day':
                $startDate = Carbon::today();
                $endDate = Carbon::today()->endOfDay();
                break;
            case 'yearly':
                $startDate = Carbon::now()->startOfYear();
                $endDate = Carbon::now()->endOfYear();
                break;
            default:
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
                break;
        }
        $totalAppointments = Appointment::where('doctor_id', $doctorId)->whereBetween('created_at', [$startDate, $endDate])->count();
        $canceledAppointments = Appointment::where('doctor_id', $doctorId)->whereBetween('created_at', [$startDate, $endDate])
            ->withTrashed()
            ->whereNotNull('deleted_at')
            ->count();
        $cancellationRate = $totalAppointments > 0 ? ($canceledAppointments / $totalAppointments) * 100 : null;
        return response()->json([
            'data' => [
                'totalAppointments' => $totalAppointments,
                'canceledAppointments' => $canceledAppointments,
                'cancellationRate' => $cancellationRate,
            ],
        ]);
    }
    public function getAverageTimeInCurrent()
    {
        $doctorId = $this->checkUserRole();
        $cacheKey = "average_time_in_current_doctor_{$doctorId}";
        $cachedResult = Cache::get($cacheKey);
        if ($cachedResult) {
            return response()->json([
                'data' => $cachedResult,
            ]);
        }
        $logs = WaitingRoomLogs::where('doctor_id', $doctorId)->whereIn('status', ['current', 'exit_current'])
            ->orderBy('waiting_room_id')
            ->orderBy('status_changed_at')
            ->get()
            ->groupBy('waiting_room_id');

        $totalTimeSpent = 0;
        $patientSessions = 0;

        foreach ($logs as $waitingRoomId => $logGroup) {
            $currentEntryTime = null;

            foreach ($logGroup as $log) {
                if ($log->status === 'current') {
                    $currentEntryTime = $log->status_changed_at;
                } elseif ($log->status === 'exit_current' && $currentEntryTime) {
                    $totalTimeSpent += strtotime($log->status_changed_at) - strtotime($currentEntryTime);
                    $currentEntryTime = null; // Reset for the next pair
                    $patientSessions++;
                }
            }

            // Handle unmatched "current" log
            if ($currentEntryTime) {
                $totalTimeSpent += strtotime(now()) - strtotime($currentEntryTime);
                $patientSessions++;
            }
        }

        $averageTime = $patientSessions > 0 ? $totalTimeSpent / $patientSessions : 0;
        $readableTime = $this->formatTime($averageTime);
        $result = [
            'average_time_in_current' => round($averageTime, 2), // seconds
            'formatted_time' =>  $readableTime,  // formatted HH:mm:ss
        ];

        // Cache the result for future requests
        Cache::put($cacheKey, $result, now()->addMinutes(10));

        return response()->json([
            'data' => $result,
        ]);
    }
    private function formatTime($timeInSeconds)
    {
        $hours = floor($timeInSeconds / 3600);
        $minutes = floor(($timeInSeconds % 3600) / 60);
        $seconds = $timeInSeconds % 60;

        $parts = [];
        if ($hours > 0) {
            $parts[] = $hours . ' ' . ($hours > 1 ? 'heures' : 'heure');
        }
        if ($minutes > 0) {
            $parts[] = $minutes . ' ' . ($minutes > 1 ? 'minutes' : 'minute');
        }
        if ($seconds > 0) {
            $parts[] = $seconds . ' ' . ($seconds > 1 ? 'secondes' : 'seconde');
        }

        return implode(', ', $parts);
    }

    public function getDates($type)
    {
        switch ($type) {
            case "day":
                $hours = [];
                for ($i = 8; $i <= 18; $i++) { // Loop from 8 AM (8) to 6 PM (18)
                    $hours[sprintf('%02d:00', $i)] = 0;
                }
                return [
                    Carbon::now()->startOfDay(),
                    Carbon::now()->endOfDay(),
                    $hours
                ];
            case "week":
                return [
                    Carbon::now()->startOfWeek(Carbon::MONDAY),
                    Carbon::now()->endOfWeek(Carbon::SUNDAY),
                    [
                        __('Monday') => 0,
                        __('Tuesday') => 0,
                        __('Wednesday') => 0,
                        __('Thursday') => 0,
                        __('Friday') => 0,
                        __('Saturday') => 0,
                        __('Sunday') => 0,
                    ]
                ];
            case "month":
                $month = Carbon::now()->format('m');
                $year = Carbon::now()->format('Y');
                $firstDay = mktime(0, 0, 0, $month, 1, $year);
                $daysInMonth = (int) date('t', $firstDay);
                $dayOfWeek = (int) date('w', $firstDay);
                $weekOffset = ($dayOfWeek === 0) ? 6 : $dayOfWeek - 1;
                $count = (int) ceil(($daysInMonth + $weekOffset) / 7);
                $weeks = [];
                for ($i = 1; $i <= $count; $i++) {
                    $weeks[__('Week') . ' ' . $i] = 0;
                }
                return [
                    Carbon::now()->startOfMonth(),
                    Carbon::now()->endOfMonth(),
                    $weeks
                ];
            case "year":
                return [
                    Carbon::now()->startOfYear(),
                    Carbon::now()->endOfYear(),
                    [
                        __('January') => 0,
                        __('February') => 0,
                        __('March') => 0,
                        __('April') => 0,
                        __('May') => 0,
                        __('June') => 0,
                        __('July') => 0,
                        __('August') => 0,
                        __('September') => 0,
                        __('October') => 0,
                        __('November') => 0,
                        __('December') => 0,
                    ]
                ];
        }
    }

    public function formatWeek($datestr)
    {
        $date = new \DateTime($datestr);
        $dayOfWeek = $date->format('N');
        $dayOfMonth = $date->format('j');
        $startDayOfWeek = (new \DateTime($date->format('Y-m-01')))->format('N');
        return (int) ceil(($dayOfMonth + $startDayOfWeek - $dayOfWeek) / 7);
    }

    public function groupKey($model, $type)
    {
        switch ($type) {
            case 'day':
                return $model->created_at->format('H:00');
            case 'week':
                return __($model->created_at->format('l'));
            case 'month':
                return __('Week') . ' ' . $this->formatWeek($model->created_at->format('Y-m-d'));
            case 'year':
                return __($model->created_at->format('F'));
        }
    }

    public function getMonthlyCanceledAppointments()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        [$start, $end, $columns] = $this->getDates($userPreference);
        Appointment::where('doctor_id', $doctorId)->withTrashed()->whereBetween('created_at', [$start, $end])->onlyTrashed()->get()
            ->groupBy(function ($carry) use ($userPreference) {
                return $this->groupKey($carry, $userPreference);
            })
            ->map(function ($group) {
                return $group->count();
            })
            ->each(function ($item, $key) use (&$columns) {
                $columns[$key] = $item;
            });
        return response()->json([
            'data' => $columns,
        ]);
    }
    public function getMonthlyAppointments()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        [$start, $end, $columns] = $this->getDates($userPreference);
        Appointment::where('doctor_id', $doctorId)->whereBetween('created_at', [$start, $end])->get()
            ->groupBy(function ($carry) use ($userPreference) {
                return $this->groupKey($carry, $userPreference);
            })
            ->map(function ($group) {
                return $group->count();
            })
            ->each(function ($item, $key) use (&$columns) {
                $columns[$key] = $item;
            });
        return response()->json([
            'data' => $columns,
        ]);
    }
    public function getTotalRevenue()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        [$currentStart, $currentEnd, $currentColumns] = $this->getDates($userPreference);
        $oldStart = null;
        $oldEnd = null;
        $oldColumns = array_map(function ($item) {
            return $item;
        }, $currentColumns);

        switch ($userPreference) {
            case 'day':
                $oldStart = Carbon::parse($currentStart)->subDay(1);
                $oldEnd = Carbon::parse($currentEnd)->subDay(1);
                break;
            case 'week':
                $oldStart = Carbon::parse($currentStart)->subWeek(1);
                $oldEnd = Carbon::parse($currentEnd)->subWeek(1);
                break;
            case 'month':
                $oldStart = Carbon::parse($currentStart)->subMonth(1);
                $oldEnd = Carbon::parse($currentEnd)->subMonth(1);
                break;
            case 'year':
                $oldStart = Carbon::parse($currentStart)->subYear(1);
                $oldEnd = Carbon::parse($currentEnd)->subYear(1);
                break;
        }

        Operation::where('doctor_id', $doctorId)->whereBetween('created_at', [$currentStart, $currentEnd])->get()
            ->groupBy(function ($carry) use ($userPreference) {
                return $this->groupKey($carry, $userPreference);
            })
            ->map(function ($group) {
                return $group->sum('total_cost');
            })
            ->each(function ($item, $key) use (&$currentColumns) {
                $currentColumns[$key] = $item;
            });

        Operation::where('doctor_id', $doctorId)->whereBetween('created_at', [$oldStart, $oldEnd])->get()
            ->groupBy(function ($carry) use ($userPreference) {
                return $this->groupKey($carry, $userPreference);
            })
            ->map(function ($group) {
                return $group->sum('total_cost');
            })
            ->each(function ($item, $key) use (&$oldColumns) {
                $oldColumns[$key] = $item;
            });
        return response()->json([
            'data' => [$oldColumns, $currentColumns],
        ]);
    }
    public function OnlyCashierNumber()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        [$start, $end, $columns] = $this->getDates($userPreference);

        $totalPayment = Payment::query()
            ->join('operations', 'operations.id', '=', 'payments.operation_id')
            ->where('operations.doctor_id', $doctorId)
            ->whereBetween('payments.created_at', [$start, $end])
            ->sum('payments.amount_paid');

        return response()->json([
            'data' => $totalPayment,
        ]);
    }
    public function retrieveFromCashier()
    {
        $doctorId = $this->checkUserRole();
        $userPreference = UserPreference::where('doctor_id', $doctorId)->pluck('kpi_date')->first();
        [$start, $end, $columns] = $this->getDates($userPreference);
        $totalPayment = Payment::query()
            ->join('operations', 'operations.id', '=', 'payments.operation_id')
            ->where('operations.doctor_id', $doctorId)
            ->whereBetween('payments.created_at', [$start, $end])
            ->get(['payments.*']);
        $totalPayment
            ->groupBy(function ($carry) use ($userPreference) {
                return $this->groupKey($carry, $userPreference);
            })
            ->map(function ($group) {
                return $group->sum('amount_paid');
            })
            ->each(function ($item, $key) use (&$columns) {
                $columns[$key] = $item;
            });

        return response()->json([
            'data' => $columns,
        ]);
    }
    // hna wslt *******************************************
    public function calculateAgePercentage()
    {
        $doctorId = $this->checkUserRole();
        $ageGroups = Patient::where('doctor_id', $doctorId)->selectRaw('CASE 
                                WHEN TIMESTAMPDIFF(YEAR, date, CURDATE()) <= 20 THEN "0-20" 
                                WHEN TIMESTAMPDIFF(YEAR, date, CURDATE()) <= 30 THEN "21-30" 
                                WHEN TIMESTAMPDIFF(YEAR, date, CURDATE()) <= 40 THEN "31-40" 
                                WHEN TIMESTAMPDIFF(YEAR, date, CURDATE()) <= 50 THEN "41-50" 
                                WHEN TIMESTAMPDIFF(YEAR, date, CURDATE()) <= 60 THEN "51-60" 
                                ELSE "61+" 
                             END as age_group, COUNT(*) as count')
            ->groupBy('age_group')
            ->orderByRaw('CAST(SUBSTRING(age_group, 1, 2) AS SIGNED)')
            ->get();
        $percentageData = $ageGroups->map(function ($group) {

            return [
                'age_group' => $group->age_group,
                'count' => $group->count,

            ];
        });
        return response()->json(['data' => $percentageData]);
    }
    public function TotalPatients()
    {
        $doctorId = $this->checkUserRole();
        $data = Patient::where('doctor_id', $doctorId)->count();
        return response()->json(['data' => $data]);
    }
    public function countPatientsByReferral()
    {
        $doctorId = $this->checkUserRole();
        $patients = Patient::where('doctor_id', $doctorId)->select('referral')->get();

        $referralCounts = [];

        foreach ($patients as $patient) {
            if (isset($patient->referral)) {
                foreach ($patient->referral as $referral) {
                    if ($referral) {
                        if (!isset($referralCounts[$referral])) {
                            $referralCounts[$referral] = 0;
                        }
                        $referralCounts[$referral]++;
                    }
                }
            }
        }

        // Sort referrals by count (optional)
        arsort($referralCounts);

        return response()->json(['data' => $referralCounts]);
    }


    /* public function appointmentKpipeak()
    {
       
        $appointments = Appointment::where('doctor_id', $id)->latest()->with('patient')->take(5)->get();

        return response()->json([
            'data' => AppointmentKpi::collection($appointments),
        ]);
    } */
    /* public function PatientsDebt(Request $request)
    {



        $Operations = Operation::with('patient', 'operationdetails', 'payments')->where('is_paid', 0)->whereBetween('created_at', [Carbon::parse($request->date)->startOfDay(),  Carbon::parse($request->date2)->endOfDay()])->get();
        return   SearchOperationDebtResource::collection($Operations);
    } */
    /* public function PatientsDebt(Request $request)
    {
        Log::info('Request data:', $request->all());

        $startDate = Carbon::parse($request->date)->startOfDay();
        $endDate = Carbon::parse($request->date2)->endOfDay();

        Log::info('Start Date:', [$startDate]);
        Log::info('End Date:', [$endDate]);

        $hospitals = $request->hospitals;

        if ($hospitals === "tout") {
            Log::info('Fetching all unpaid operations within date range...');

            // Fetch unpaid operations from `Operation` table
            $internalOperations = Operation::with('patient', 'operationdetails', 'payments')
                ->where('is_paid', 0)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            // Fetch unpaid operations from `outsourceOperation` table
            $externalOperations = outsourceOperation::with([
                'operation.patient',
                'operation.operationdetails',
                'operation.payments',
            ])
                ->whereHas('operation', function ($query) use ($startDate, $endDate) {
                    $query->where('is_paid', 0)
                        ->whereBetween('created_at', [$startDate, $endDate]);
                })
                ->get();

            // Merge both collections
            $Operations = $internalOperations->merge(
                $externalOperations->map(function ($external) {
                    return $external->operation; // Extract `operation` from `outsourceOperation`
                })
            );

            Log::info('Fetched All Operations:', $Operations->toArray());
        } elseif (is_array($hospitals) && count($hospitals) > 0) {
            Log::info('Fetching operations via outsourceOperation for specific hospital IDs:', $hospitals);

            // Fetch operations via outsourceOperation
            $Operations = outsourceOperation::with([
                'operation.patient',
                'operation.operationdetails',
                'operation.payments',
            ])
                ->whereIn('hospital_id', $hospitals)
                ->whereHas('operation', function ($query) use ($startDate, $endDate) {
                    $query->where('is_paid', 0)
                        ->whereBetween('created_at', [$startDate, $endDate]);
                })
                ->get();

            Log::info('Fetched Operations via outsourceOperation:', $Operations->toArray());
        } else {
            Log::info('No valid hospital filter provided.');
            $Operations = Operation::with('patient', 'operationdetails', 'payments')
                ->where('is_paid', 0)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->whereDoesntHave('externalOperations') // Exclude operations linked to outsourceOperation
                ->get();
        }

        // Return the operations wrapped in a resource collection
        return SearchOperationDebtResource::collection($Operations);
    } */

    public function PatientsDebt(Request $request)
    {
        $doctorId = $this->checkUserRole();
        $startDate = Carbon::parse($request->date)->startOfDay();
        $endDate = Carbon::parse($request->date2)->endOfDay();
        $hospitals = $request->hospitals;

        // Base query to filter by date and doctor_id using operation relationship
        $query = Payment::query()
            ->join('operations', 'operations.id', '=', 'payments.operation_id') // Join with operations table
            ->where('operations.doctor_id', $doctorId) // Scope by doctor_id
            ->whereBetween('payments.created_at', [$startDate, $endDate]); // Filter by date range

        if ($hospitals === "tout") {
            // Fetch all payments linked to the doctor
            $payments = $query->get(['payments.*']); // Fetch only payment fields
        } elseif (is_array($hospitals) && count($hospitals) > 0) {
            // Fetch payments linked to specific hospitals
            $payments = $query
                ->join('external_operations', 'external_operations.operation_id', '=', 'operations.id') // Join with external_operations
                ->whereIn('external_operations.hospital_id', $hospitals) // Filter by hospitals
                ->get(['payments.*']); // Fetch only payment fields
        } else {
            // Fetch all payments not linked to outsource operations
            $payments = $query
                ->whereDoesntHave('operation.externalOperations') // Filter operations without externalOperations
                ->get(['payments.*']); // Fetch only payment fields
        }

        return SearchOperationDebtResource::collection($payments);
    }
    public function getPaymentKpi()
    {
        $doctorId = $this->checkUserRole();
        $operations = DB::table('operations')
            ->select('id as operation_id', DB::raw('SUM(total_cost) as total_operation_cost'))
            ->where('doctor_id', $doctorId) // Scope by doctor_id
            ->groupBy('id');
        $payments = DB::table('payments')
            ->join('operations', 'operations.id', '=', 'payments.operation_id') // Join payments with operations
            ->select('payments.operation_id', DB::raw('SUM(amount_paid) as total_amount_paid'))
            ->where('operations.doctor_id', $doctorId) // Scope payments by doctor_id via operation
            ->groupBy('payments.operation_id');

        $results = DB::table(DB::raw("({$operations->toSql()}) as operations"))
            ->mergeBindings($operations)
            ->leftJoinSub($payments, 'payments', 'operations.operation_id', '=', 'payments.operation_id')
            ->select(
                DB::raw('COALESCE(SUM(payments.total_amount_paid), 0) as total_paid'),
                DB::raw('COALESCE(SUM(operations.total_operation_cost), 0) - COALESCE(SUM(payments.total_amount_paid), 0) as total_debt')
            )
            ->first();

        return response()->json([
            'data' => [
                'Paiement' => $results->total_paid ?? 0,
                'Crédit' => $results->total_debt ?? 0,
            ]
        ]);
    }
}
