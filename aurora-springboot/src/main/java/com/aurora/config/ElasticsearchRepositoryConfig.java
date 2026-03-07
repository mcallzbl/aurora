package com.aurora.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@ConditionalOnProperty(name = "search.mode", havingValue = "elasticsearch")
@EnableElasticsearchRepositories(basePackages = "com.aurora.repository")
public class ElasticsearchRepositoryConfig {

}
