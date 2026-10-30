package com.fuelstationfinder;

import java.sql.Connection;
import java.sql.SQLException;

final class Sql {
    private Sql() {}
    static int execute(Connection connection, String sql, Object... values) throws SQLException {
        try (var statement = connection.prepareStatement(sql)) {
            for (int index = 0; index < values.length; index++) statement.setObject(index + 1, values[index]);
            statement.execute();
            return statement.getUpdateCount();
        }
    }
}
