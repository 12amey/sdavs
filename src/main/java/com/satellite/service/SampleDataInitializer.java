package com.satellite.service;

import com.satellite.model.SatelliteData;
import com.satellite.repository.SatelliteDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class SampleDataInitializer implements CommandLineRunner {

    @Autowired
    private SatelliteDataRepository satelliteDataRepository;

    @Override
    public void run(String... args) throws Exception {
        // Check if data already exists
        long count = satelliteDataRepository.count();
        if (count > 0) {
            System.out.println("✅ Database already has " + count + " records. Skipping sample data insertion.");
            return;
        }

        System.out.println("📊 Inserting sample environmental data for 6 cities...");

        // Mumbai
        SatelliteData mumbai = new SatelliteData();
        mumbai.setCity("Mumbai");
        mumbai.setLocationName("Mumbai Central");
        mumbai.setState("Maharashtra");
        mumbai.setLatitude(19.0760);
        mumbai.setLongitude(72.8777);
        mumbai.setNdviValue(0.4523);
        mumbai.setPreviousNdvi(0.4412);
        mumbai.setNdviChangePercent(2.52);
        mumbai.setNdwiValue(0.2134);
        mumbai.setDeforestationRisk("MEDIUM");
        mumbai.setFloodRisk(35.67);
        mumbai.setAirQualityIndex(156.0);
        mumbai.setPm25(78.5);
        mumbai.setTemperature(29.3);
        mumbai.setAnalysisDate(LocalDateTime.now());
        mumbai.setDataSource("Sentinel-2 & Open-Meteo");
        satelliteDataRepository.save(mumbai);

        // Delhi
        SatelliteData delhi = new SatelliteData();
        delhi.setCity("Delhi");
        delhi.setLocationName("New Delhi");
        delhi.setState("Delhi");
        delhi.setLatitude(28.7041);
        delhi.setLongitude(77.1025);
        delhi.setNdviValue(0.3876);
        delhi.setPreviousNdvi(0.3945);
        delhi.setNdviChangePercent(-1.75);
        delhi.setNdwiValue(0.1823);
        delhi.setDeforestationRisk("HIGH");
        delhi.setFloodRisk(28.45);
        delhi.setAirQualityIndex(198.0);
        delhi.setPm25(112.3);
        delhi.setTemperature(31.2);
        delhi.setAnalysisDate(LocalDateTime.now());
        delhi.setDataSource("Sentinel-2 & Open-Meteo");
        satelliteDataRepository.save(delhi);

        // Bangalore
        SatelliteData bangalore = new SatelliteData();
        bangalore.setCity("Bangalore");
        bangalore.setLocationName("Bangalore City");
        bangalore.setState("Karnataka");
        bangalore.setLatitude(12.9716);
        bangalore.setLongitude(77.5946);
        bangalore.setNdviValue(0.6234);
        bangalore.setPreviousNdvi(0.6085);
        bangalore.setNdviChangePercent(2.45);
        bangalore.setNdwiValue(0.1567);
        bangalore.setDeforestationRisk("LOW");
        bangalore.setFloodRisk(18.23);
        bangalore.setAirQualityIndex(85.0);
        bangalore.setPm25(42.3);
        bangalore.setTemperature(26.8);
        bangalore.setAnalysisDate(LocalDateTime.now());
        bangalore.setDataSource("Sentinel-2 & Open-Meteo");
        satelliteDataRepository.save(bangalore);

        // Chennai
        SatelliteData chennai = new SatelliteData();
        chennai.setCity("Chennai");
        chennai.setLocationName("Chennai Central");
        chennai.setState("Tamil Nadu");
        chennai.setLatitude(13.0827);
        chennai.setLongitude(80.2707);
        chennai.setNdviValue(0.5123);
        chennai.setPreviousNdvi(0.4987);
        chennai.setNdviChangePercent(2.73);
        chennai.setNdwiValue(0.2456);
        chennai.setDeforestationRisk("MEDIUM");
        chennai.setFloodRisk(42.15);
        chennai.setAirQualityIndex(132.0);
        chennai.setPm25(68.7);
        chennai.setTemperature(30.5);
        chennai.setAnalysisDate(LocalDateTime.now());
        chennai.setDataSource("Sentinel-2 & Open-Meteo");
        satelliteDataRepository.save(chennai);

        // Pune
        SatelliteData pune = new SatelliteData();
        pune.setCity("Pune");
        pune.setLocationName("Pune City");
        pune.setState("Maharashtra");
        pune.setLatitude(18.5204);
        pune.setLongitude(73.8567);
        pune.setNdviValue(0.5567);
        pune.setPreviousNdvi(0.5423);
        pune.setNdviChangePercent(2.66);
        pune.setNdwiValue(0.1789);
        pune.setDeforestationRisk("LOW");
        pune.setFloodRisk(22.34);
        pune.setAirQualityIndex(98.0);
        pune.setPm25(51.2);
        pune.setTemperature(27.9);
        pune.setAnalysisDate(LocalDateTime.now());
        pune.setDataSource("Sentinel-2 & Open-Meteo");
        satelliteDataRepository.save(pune);

        // Hyderabad
        SatelliteData hyderabad = new SatelliteData();
        hyderabad.setCity("Hyderabad");
        hyderabad.setLocationName("Hyderabad City");
        hyderabad.setState("Telangana");
        hyderabad.setLatitude(17.3850);
        hyderabad.setLongitude(78.4867);
        hyderabad.setNdviValue(0.4789);
        hyderabad.setPreviousNdvi(0.4656);
        hyderabad.setNdviChangePercent(2.86);
        hyderabad.setNdwiValue(0.1923);
        hyderabad.setDeforestationRisk("MEDIUM");
        hyderabad.setFloodRisk(31.56);
        hyderabad.setAirQualityIndex(145.0);
        hyderabad.setPm25(72.8);
        hyderabad.setTemperature(29.7);
        hyderabad.setAnalysisDate(LocalDateTime.now());
        hyderabad.setDataSource("Sentinel-2 & Open-Meteo");
        satelliteDataRepository.save(hyderabad);

        System.out.println("✅ Successfully inserted sample data for 6 cities:");
        System.out.println("   - Mumbai (MEDIUM risk)");
        System.out.println("   - Delhi (HIGH risk)");
        System.out.println("   - Bangalore (LOW risk)");
        System.out.println("   - Chennai (MEDIUM risk)");
        System.out.println("   - Pune (LOW risk)");
        System.out.println("   - Hyderabad (MEDIUM risk)");
    }
}
