package com.fuelstationfinder;

public record Station(long id, int externalId, String address, double latitude, double longitude, Double distanceKm) {}
