package com.redpulse.modules.hospital.dto;

import com.redpulse.modules.hospital.entity.Hospital;
import java.time.LocalDateTime;
import java.util.UUID;

public class HospitalResponse {

    private UUID id;
    private String hospitalName;
    private String registrationNumber;
    private String phone;
    private String email;
    private String address;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private boolean active;
    private boolean verified;
    private LocalDateTime createdAt;

    public HospitalResponse() {}

    public static HospitalResponse fromEntity(Hospital hospital) {
        HospitalResponse resp = new HospitalResponse();
        resp.id = hospital.getId();
        resp.hospitalName = hospital.getHospitalName();
        resp.registrationNumber = hospital.getRegistrationNumber();
        resp.phone = hospital.getPhone();
        resp.email = hospital.getEmail();
        resp.address = hospital.getAddress();
        resp.city = hospital.getCity();
        resp.state = hospital.getState();
        resp.latitude = hospital.getLatitude();
        resp.longitude = hospital.getLongitude();
        resp.active = hospital.isActive();
        resp.verified = hospital.isVerified();
        resp.createdAt = hospital.getCreatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public String getHospitalName() { return hospitalName; }
    public String getRegistrationNumber() { return registrationNumber; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public boolean isActive() { return active; }
    public boolean isVerified() { return verified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
