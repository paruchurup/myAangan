import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vehicle, ParkingSlot, VisitorVehicle, ParkingViolation, ParkingStats } from '../models/vehicle.model';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private base = `${environment.apiUrl}/vehicles`;
  constructor(private http: HttpClient) {}

  // Resident
  getMyVehicles():                  Observable<ApiResponse<Vehicle[]>>       { return this.http.get<ApiResponse<Vehicle[]>>(`${this.base}/my`); }
  registerVehicle(fd: FormData):    Observable<ApiResponse<Vehicle>>         { return this.http.post<ApiResponse<Vehicle>>(`${this.base}/register`, fd); }
  updateVehicle(id: number, fd: FormData): Observable<ApiResponse<Vehicle>>  { return this.http.put<ApiResponse<Vehicle>>(`${this.base}/${id}`, fd); }
  deleteVehicle(id: number):        Observable<ApiResponse<void>>            { return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`); }

  // Guard
  getApprovedForGuard():            Observable<ApiResponse<Vehicle[]>>       { return this.http.get<ApiResponse<Vehicle[]>>(`${this.base}/guard/approved`); }
  getCurrentVisitors():             Observable<ApiResponse<VisitorVehicle[]>>{ return this.http.get<ApiResponse<VisitorVehicle[]>>(`${this.base}/visitors/current`); }
  logVisitorEntry(body: any):       Observable<ApiResponse<VisitorVehicle>>  { return this.http.post<ApiResponse<VisitorVehicle>>(`${this.base}/visitors/entry`, body); }
  logVisitorExit(id: number):       Observable<ApiResponse<VisitorVehicle>>  { return this.http.post<ApiResponse<VisitorVehicle>>(`${this.base}/visitors/${id}/exit`, {}); }
  getOpenViolations():              Observable<ApiResponse<ParkingViolation[]>>{ return this.http.get<ApiResponse<ParkingViolation[]>>(`${this.base}/violations/open`); }
  reportViolation(fd: FormData):    Observable<ApiResponse<ParkingViolation>>{ return this.http.post<ApiResponse<ParkingViolation>>(`${this.base}/violations`, fd); }

  // Admin / FM
  getAllVehicles():                  Observable<ApiResponse<Vehicle[]>>       { return this.http.get<ApiResponse<Vehicle[]>>(this.base); }
  getPendingVehicles():             Observable<ApiResponse<Vehicle[]>>       { return this.http.get<ApiResponse<Vehicle[]>>(`${this.base}/pending`); }
  getVehicleById(id: number):       Observable<ApiResponse<Vehicle>>         { return this.http.get<ApiResponse<Vehicle>>(`${this.base}/${id}`); }
  approveVehicle(id: number):       Observable<ApiResponse<Vehicle>>         { return this.http.post<ApiResponse<Vehicle>>(`${this.base}/${id}/approve`, {}); }
  rejectVehicle(id: number, reason: string): Observable<ApiResponse<Vehicle>> { return this.http.post<ApiResponse<Vehicle>>(`${this.base}/${id}/reject`, { reason }); }
  suspendVehicle(id: number, reason: string): Observable<ApiResponse<Vehicle>>{ return this.http.post<ApiResponse<Vehicle>>(`${this.base}/${id}/suspend`, { reason }); }
  getStats():                       Observable<ApiResponse<ParkingStats>>    { return this.http.get<ApiResponse<ParkingStats>>(`${this.base}/stats`); }

  // Resident: claim own slot
  claimMySlot(body: any):            Observable<ApiResponse<ParkingSlot>>     { return this.http.post<ApiResponse<ParkingSlot>>(`${this.base}/my/slot`, body); }

  // Slots
  getAllSlots():                     Observable<ApiResponse<ParkingSlot[]>>   { return this.http.get<ApiResponse<ParkingSlot[]>>(`${this.base}/slots`); }
  getAvailableSlots():              Observable<ApiResponse<ParkingSlot[]>>   { return this.http.get<ApiResponse<ParkingSlot[]>>(`${this.base}/slots/available`); }
  createSlot(body: any):            Observable<ApiResponse<ParkingSlot>>     { return this.http.post<ApiResponse<ParkingSlot>>(`${this.base}/slots`, body); }
  updateSlot(id: number, body: any):Observable<ApiResponse<ParkingSlot>>     { return this.http.put<ApiResponse<ParkingSlot>>(`${this.base}/slots/${id}`, body); }
  deleteSlot(id: number):           Observable<ApiResponse<void>>            { return this.http.delete<ApiResponse<void>>(`${this.base}/slots/${id}`); }
  assignVehicleToSlot(slotId: number, vehicleId: number): Observable<ApiResponse<ParkingSlot>> {
    return this.http.post<ApiResponse<ParkingSlot>>(`${this.base}/slots/${slotId}/assign/${vehicleId}`, {});
  }
  unassignSlot(slotId: number):     Observable<ApiResponse<ParkingSlot>>     { return this.http.post<ApiResponse<ParkingSlot>>(`${this.base}/slots/${slotId}/unassign`, {}); }
  unassignVehicleFromSlot(slotId: number, vehicleId: number): Observable<ApiResponse<ParkingSlot>> {
    return this.http.post<ApiResponse<ParkingSlot>>(`${this.base}/slots/${slotId}/unassign/${vehicleId}`, {});
  }

  // Violations
  getAllViolations():                Observable<ApiResponse<ParkingViolation[]>>{ return this.http.get<ApiResponse<ParkingViolation[]>>(`${this.base}/violations`); }
  resolveViolation(id: number, note: string): Observable<ApiResponse<ParkingViolation>> {
    return this.http.post<ApiResponse<ParkingViolation>>(`${this.base}/violations/${id}/resolve`, { note });
  }

  // Visitor logs (admin)
  getAllVisitorLogs():               Observable<ApiResponse<VisitorVehicle[]>>{ return this.http.get<ApiResponse<VisitorVehicle[]>>(`${this.base}/visitors`); }
}
