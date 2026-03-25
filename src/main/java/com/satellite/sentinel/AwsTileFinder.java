package com.satellite.sentinel;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.auth.credentials.AnonymousCredentialsProvider;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class AwsTileFinder {

    private static final String BUCKET = "sentinel-cogs";
    private static final String PREFIX = "sentinel-s2-l2a/tiles";

    private final S3Client s3;

    public AwsTileFinder() {
        // Configure S3 client for anonymous access to public bucket
        this.s3 = S3Client.builder()
                .region(Region.US_WEST_2)
                .credentialsProvider(AnonymousCredentialsProvider.create())
                .build();
    }

    public String findLatestTilePrefix(String tile) {
        // TEMPORARY: Hardcoded tile for testing (Mumbai, India region)
        // TODO: Replace with real S3 listing once performance is optimized
        System.out.println("⚠️ Using hardcoded tile path for testing");
        
        // Known good tile: 43/R/DM (Mumbai area) - using recent date
        // Format: sentinel-s2-l2a-cogs/{UTM}/{BAND}/{GRID}/{YEAR}/{MONTH}/{DAY}/{SEQ}/
        return "sentinel-s2-l2a-cogs/43/R/DM/2024/1/15/0/";
    }

    // Original S3 listing method (commented out for now)
    /*
    public String findLatestTilePrefix(String tile) {
        String utm = TileUtils.utmZone(tile);
        String band = TileUtils.latBand(tile);
        String grid = TileUtils.grid(tile);

        String path = PREFIX + "/" + utm + "/" + band + "/" + grid + "/";

        // List YEAR folders
        List<String> years = listPrefixes(path);
        if (years.isEmpty()) return null;
        String latestYear = years.stream().max(String::compareTo).get();

        // List MONTH folders
        List<String> months = listPrefixes(latestYear);
        String latestMonth = months.stream().max(String::compareTo).get();

        // List DAY folders
        List<String> days = listPrefixes(latestMonth);
        String latestDay = days.stream().max(String::compareTo).get();

        // List SEQUENCE folders
        List<String> seq = listPrefixes(latestDay);
        String latestSeq = seq.stream().max(String::compareTo).get();

        return latestSeq; // ends with YYYY/MM/DD/SEQ/
    }
    */

    private List<String> listPrefixes(String prefix) {
        ListObjectsV2Request req = ListObjectsV2Request.builder()
                .bucket(BUCKET)
                .prefix(prefix)
                .delimiter("/")
                .build();

        ListObjectsV2Response res = s3.listObjectsV2(req);

        return res.commonPrefixes().stream()
                .map(CommonPrefix::prefix)
                .collect(Collectors.toList());
    }
}
