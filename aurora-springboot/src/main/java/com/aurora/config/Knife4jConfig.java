package com.aurora.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;

@Configuration
public class Knife4jConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("aurora文档")
                        .description("aurora")
                        .version("1.0")
                        .contact(new Contact()
                                .name("mcallzbl")
                                .email("contact@mail.mcallzbl.com")))
                .servers(Collections.singletonList(new Server()
                        .url("https://www.devillusion.asia")
                        .description("摸鱼的小破站")));
    }

}
