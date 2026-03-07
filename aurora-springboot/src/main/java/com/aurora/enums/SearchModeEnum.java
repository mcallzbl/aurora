package com.aurora.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SearchModeEnum {

    MYSQL("mysql", "mySqlSearchStrategyImpl"),

    MYSQL_LIKE("mysql_like", "mySqlLikeSearchStrategyImpl"),

    ELASTICSEARCH("elasticsearch", "esSearchStrategyImpl");

    private final String mode;

    private final String strategy;

    public static String getStrategy(String mode) {
        for (SearchModeEnum value : SearchModeEnum.values()) {
            if (value.getMode().equals(mode)) {
                return value.getStrategy();
            }
        }
        return null;
    }

}
