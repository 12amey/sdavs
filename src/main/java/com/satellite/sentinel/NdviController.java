package com.satellite.sentinel;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ndvi")
@CrossOrigin(origins = "*")
public class NdviController {

    private final AwsTileFinder finder = new AwsTileFinder();
    private final NdviService ndviService = new NdviService();

    @GetMapping(value = "/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getNdviImage(
            @RequestParam double lat,
            @RequestParam double lon
    ) {
        try {
            System.out.println("🛰️ NDVI request for lat=" + lat + ", lon=" + lon);
            
            String tile = TileUtils.latLonToTile(lat, lon);
            System.out.println("📍 MGRS Tile: " + tile);
            
            String prefix = finder.findLatestTilePrefix(tile);

            if (prefix == null) {
                System.err.println("❌ No Sentinel-2 data found for tile: " + tile);
                return ResponseEntity.notFound().build();
            }

            System.out.println("✅ Found tile prefix: " + prefix);

            String b04 = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/" + prefix + "B04.tif";
            String b08 = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/" + prefix + "B08.tif";

            System.out.println("🔗 Fetching B04: " + b04);
            System.out.println("🔗 Fetching B08: " + b08);

            byte[] image = ndviService.computeNdviPng(b04, b08);
            
            System.out.println("✅ NDVI computation complete. Image size: " + image.length + " bytes");
            
            return ResponseEntity.ok(image);
        } catch (Exception e) {
            System.err.println("❌ ERROR in NDVI endpoint:");
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(("Error: " + e.getMessage() + "\nCause: " + e.getCause()).getBytes());
        }
    }
}
