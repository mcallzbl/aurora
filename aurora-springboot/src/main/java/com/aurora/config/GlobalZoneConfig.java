package com.aurora.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

import static com.aurora.enums.ZoneEnum.SHANGHAI;

@Configuration
public class GlobalZoneConfig {

    @PostConstruct
    public void setGlobalZone() {
        TimeZone.setDefault(TimeZone.getTimeZone(SHANGHAI.getZone()));
    }

}
